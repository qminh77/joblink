-- =============================================================================
-- JOBLINK MIGRATION 20260531_025 — COMPANY RECRUITMENT COMPLETION
-- =============================================================================
-- Bổ sung các chức năng company còn thiếu so với SRS:
--   • FR-M05-005 / UC-14: Lịch phỏng vấn (interview_schedules) — recruiter tạo
--     lịch khi chuyển ứng viên sang 'interview'; ứng viên xác nhận / từ chối.
--   • UC-12: RPC get_my_applications — member theo dõi trạng thái đơn + timeline
--     history + lịch phỏng vấn (cần cho luồng xác nhận lịch).
--   • FR-M02-007 / UC-06: resubmit_company_verification — company gửi lại hồ sơ
--     khi bị reject / pending_update (→ pending).
--   • FR-M05-001 / UC-09: expire_due_jobs() + hiển thị status 'expired' hiệu lực
--     theo expires_at trong dashboard (không phụ thuộc cron).
--   • FR-M07-004: job_view_logs + log_job_view() + đếm lượt xem job vào dashboard.
--
-- Quy ước: tất cả RPC SECURITY INVOKER, tự resolve user qua auth.uid() và check
-- quyền sở hữu; trả jsonb union {ok,...}. RLS KHÔNG bật trên bảng recruitment
-- (giống job_applications/application_status_history) nên INVOKER ghi được.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. interview_schedules: thêm trạng thái phản hồi của ứng viên
-- -----------------------------------------------------------------------------
ALTER TABLE public.interview_schedules
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'declined')),
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_interview_schedules_application
    ON public.interview_schedules(application_id, scheduled_at DESC);

-- RPC ghi bằng SECURITY INVOKER → cấp quyền DML cho authenticated (RLS không bật
-- trên bảng recruitment, khớp với job_applications/application_status_history).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_schedules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.interview_schedules_id_seq TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. job_view_logs: nhật ký lượt xem job (FR-M07-004)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    job_id         BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    viewer_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_view_logs_job
    ON public.job_view_logs(job_id, viewed_at DESC);

GRANT SELECT, INSERT ON public.job_view_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.job_view_logs_id_seq TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: log_job_view — đếm lượt xem (dedupe theo viewer+job trong 6 giờ;
--    bỏ qua khi viewer chính là chủ job để không tự bơm số liệu).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_job_view(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_owner BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    SELECT company_user_id INTO v_owner
      FROM public.jobs
     WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;

    IF v_owner IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    -- Không log khi chủ job tự xem.
    IF v_me IS NOT NULL AND v_me = v_owner THEN
        RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE);
    END IF;

    -- Dedupe: cùng viewer + job trong 6 giờ → bỏ qua.
    IF v_me IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.job_view_logs
         WHERE job_id = p_job_id
           AND viewer_user_id = v_me
           AND viewed_at > NOW() - INTERVAL '6 hours'
    ) THEN
        RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE);
    END IF;

    INSERT INTO public.job_view_logs(job_id, viewer_user_id)
    VALUES (p_job_id, v_me);

    RETURN jsonb_build_object('ok', TRUE, 'logged', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_job_view(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. expire_due_jobs — chuyển active → expired khi quá expires_at.
--    SECURITY DEFINER để có thể chạy bởi cron/admin bất kỳ. Trả số job đã đổi.
--    Được gọi opportunistic ở đầu get_company_dashboard_overview (xem dưới).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_due_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
DECLARE
    v_count INT;
BEGIN
    WITH updated AS (
        UPDATE public.jobs
           SET status = 'expired', updated_at = NOW()
         WHERE status = 'active'
           AND deleted_at IS NULL
           AND expires_at IS NOT NULL
           AND expires_at <= NOW()
        RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_count FROM updated;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_due_jobs() TO authenticated;

-- Lên lịch chạy mỗi 15 phút nếu pg_cron khả dụng (an toàn nếu không có).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'joblink-expire-jobs',
            '*/15 * * * *',
            'SELECT public.expire_due_jobs();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Không chặn migration nếu schedule lỗi (vd extension thiếu quyền).
    NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC: schedule_interview — recruiter tạo / dời lịch phỏng vấn.
--    Owner-only. Chuyển đơn sang 'interview' (ghi history) nếu chưa terminal.
--    Reschedule = xoá lịch cũ rồi tạo lịch mới (1 lịch hiệu lực / đơn).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.schedule_interview(
    p_application_id  BIGINT,
    p_scheduled_at    TIMESTAMPTZ,
    p_duration_minutes INT,
    p_location_or_link TEXT,
    p_note            TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
    v_applicant_id BIGINT;
    v_job_id BIGINT;
    v_job_title TEXT;
    v_duration INT;
    v_interview_id BIGINT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT j.company_user_id, a.status, a.applicant_id, j.id, j.title
      INTO v_company_user_id, v_old_status, v_applicant_id, v_job_id, v_job_title
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = p_application_id
       AND j.deleted_at IS NULL
     LIMIT 1;

    IF v_company_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound');
    END IF;
    IF v_company_user_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;
    IF v_old_status IN ('hired', 'rejected', 'withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotSchedule');
    END IF;
    IF p_scheduled_at IS NULL OR p_scheduled_at <= v_now THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidScheduleTime');
    END IF;

    v_duration := COALESCE(p_duration_minutes, 60);
    IF v_duration < 15 OR v_duration > 480 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDuration');
    END IF;

    -- Reschedule: xoá lịch cũ của đơn này.
    DELETE FROM public.interview_schedules WHERE application_id = p_application_id;

    INSERT INTO public.interview_schedules(
        application_id, scheduled_at, duration_minutes, location_or_link,
        note, created_by, status
    ) VALUES (
        p_application_id, p_scheduled_at, v_duration,
        NULLIF(btrim(COALESCE(p_location_or_link, '')), ''),
        NULLIF(btrim(COALESCE(p_note, '')), ''),
        v_me, 'scheduled'
    )
    RETURNING id INTO v_interview_id;

    -- Đồng bộ trạng thái đơn sang 'interview' (+history) nếu chưa.
    IF v_old_status <> 'interview' THEN
        UPDATE public.job_applications
           SET status = 'interview', updated_at = v_now
         WHERE id = p_application_id;

        INSERT INTO public.application_status_history(
            application_id, old_status, new_status, changed_by, note, changed_at
        ) VALUES (
            p_application_id, v_old_status, 'interview', v_me, NULL, v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'interviewId', v_interview_id,
        'applicationId', p_application_id,
        'applicantId', v_applicant_id,
        'jobId', v_job_id,
        'jobTitle', v_job_title,
        'scheduledAt', p_scheduled_at,
        'statusChanged', v_old_status <> 'interview'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_interview(
    BIGINT, TIMESTAMPTZ, INT, TEXT, TEXT
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: respond_interview — ứng viên xác nhận / từ chối lịch.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_interview(
    p_interview_id BIGINT,
    p_accept BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_applicant_id BIGINT;
    v_company_user_id BIGINT;
    v_job_id BIGINT;
    v_job_title TEXT;
    v_application_id BIGINT;
    v_new_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT a.applicant_id, j.company_user_id, j.id, j.title, a.id
      INTO v_applicant_id, v_company_user_id, v_job_id, v_job_title, v_application_id
      FROM public.interview_schedules s
      JOIN public.job_applications a ON a.id = s.application_id
      JOIN public.jobs j ON j.id = a.job_id
     WHERE s.id = p_interview_id
     LIMIT 1;

    IF v_applicant_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'interviewNotFound');
    END IF;
    IF v_applicant_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;

    v_new_status := CASE WHEN p_accept THEN 'confirmed' ELSE 'declined' END;

    UPDATE public.interview_schedules
       SET status = v_new_status, responded_at = NOW(), updated_at = NOW()
     WHERE id = p_interview_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', v_new_status,
        'companyUserId', v_company_user_id,
        'jobId', v_job_id,
        'jobTitle', v_job_title,
        'applicationId', v_application_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_interview(BIGINT, BOOLEAN) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: get_my_applications — member theo dõi đơn (UC-12) + lịch phỏng vấn.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_applications(
    p_limit INT DEFAULT 30,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);

    WITH base AS (
        SELECT a.id AS application_id, a.status, a.applied_at, a.updated_at,
               j.id AS job_id, j.title AS job_title, j.status AS job_status,
               j.company_user_id,
               COALESCE(cp.name, cu.email) AS company_name,
               cp.logo_url AS company_logo_url
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users cu ON cu.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
         WHERE a.applicant_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base ORDER BY updated_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'applicationId', p.application_id,
            'status', p.status,
            'appliedAt', p.applied_at,
            'updatedAt', p.updated_at,
            'jobId', p.job_id,
            'jobTitle', p.job_title,
            'jobStatus', p.job_status,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'interview', (
                SELECT jsonb_build_object(
                    'id', s.id,
                    'scheduledAt', s.scheduled_at,
                    'durationMinutes', s.duration_minutes,
                    'locationOrLink', s.location_or_link,
                    'note', s.note,
                    'status', s.status
                )
                FROM public.interview_schedules s
                WHERE s.application_id = p.application_id
                ORDER BY s.scheduled_at DESC
                LIMIT 1
            ),
            'history', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'oldStatus', h.old_status,
                    'newStatus', h.new_status,
                    'changedAt', h.changed_at,
                    'note', h.note
                ) ORDER BY h.changed_at), '[]'::jsonb)
                FROM public.application_status_history h
                WHERE h.application_id = p.application_id
            )
        ) ORDER BY p.updated_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_applications(INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: resubmit_company_verification — company gửi lại hồ sơ (FR-M02-007).
--    Cho phép khi đang ở 'rejected' / 'pending_update' → chuyển về 'pending'.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resubmit_company_verification()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;

    SELECT verification_status INTO v_status
      FROM public.company_profiles
     WHERE user_id = v_me AND deleted_at IS NULL LIMIT 1;

    IF v_status IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound');
    END IF;
    IF v_status NOT IN ('rejected', 'pending_update') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notResubmittable');
    END IF;

    UPDATE public.company_profiles
       SET verification_status = 'pending',
           verification_note = NULL,
           verified_by = NULL,
           verified_at = NULL,
           updated_at = NOW()
     WHERE user_id = v_me;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_company_verification() TO authenticated;

-- =============================================================================
-- 9. CẬP NHẬT get_company_dashboard_overview
--    + opportunistic expire_due_jobs()
--    + stat jobViews (tổng lượt xem job của công ty)
--    + recentJobs.viewCount + effective status 'expired'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_active_jobs INT;
    v_total_apps INT;
    v_apps_this_month INT;
    v_hires_total INT;
    v_job_views INT;
    v_recent_jobs JSONB;
    v_recent_apps JSONB;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN NULL;
    END IF;

    -- Tự chuyển job quá hạn (best-effort; không cần cron).
    PERFORM public.expire_due_jobs();

    SELECT COUNT(*)::INT INTO v_active_jobs
      FROM public.jobs j
     WHERE j.company_user_id = v_me AND j.status = 'active' AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT INTO v_total_apps
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT INTO v_apps_this_month
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());

    SELECT COUNT(*)::INT INTO v_hires_total
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL AND a.status = 'hired';

    SELECT COUNT(*)::INT INTO v_job_views
      FROM public.job_view_logs v
      JOIN public.jobs j ON j.id = v.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'status', x.status,
            'createdAt', x.created_at,
            'expiresAt', x.expires_at,
            'applicantCount', x.applicant_count,
            'viewCount', x.view_count
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_jobs
    FROM (
        SELECT j.id, j.title,
               CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                         AND j.expires_at <= NOW()
                    THEN 'expired' ELSE j.status END AS status,
               j.created_at, j.expires_at,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_applications a
                          WHERE a.job_id = j.id), 0) AS applicant_count,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_view_logs v
                          WHERE v.job_id = j.id), 0) AS view_count
          FROM public.jobs j
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
         ORDER BY j.created_at DESC
         LIMIT 5
    ) x;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'applicationId', x.application_id,
            'applicantId', x.applicant_id,
            'displayName', x.display_name,
            'avatarUrl', x.avatar_url,
            'headline', x.headline,
            'jobId', x.job_id,
            'jobTitle', x.job_title,
            'status', x.status,
            'appliedAt', x.applied_at
        ) ORDER BY x.applied_at DESC
    ), '[]'::jsonb)
    INTO v_recent_apps
    FROM (
        SELECT a.id AS application_id, a.applicant_id,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline,
               j.id AS job_id, j.title AS job_title, a.status, a.applied_at
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
         ORDER BY a.applied_at DESC
         LIMIT 5
    ) x;

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'activeJobs', v_active_jobs,
            'totalApplications', v_total_apps,
            'applicationsThisMonth', v_apps_this_month,
            'jobViews', v_job_views,
            'hireRate', CASE
                WHEN v_total_apps > 0
                THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1)
                ELSE 0 END
        ),
        'recentJobs', v_recent_jobs,
        'recentApplicants', v_recent_apps
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

-- =============================================================================
-- 10. CẬP NHẬT get_company_jobs — thêm viewCount + effective status 'expired'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_company_jobs(
    p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
    v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.*,
               CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                         AND j.expires_at <= NOW()
                    THEN 'expired' ELSE j.status END AS effective_status
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_status = 'all' OR
                (CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                           AND j.expires_at <= NOW()
                      THEN 'expired' ELSE j.status END) = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT b.id, b.title, b.effective_status AS status, b.created_at, b.expires_at,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_applications a
                          WHERE a.job_id = b.id), 0) AS applicant_count,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_view_logs v
                          WHERE v.job_id = b.id), 0) AS view_count
          FROM base b
         ORDER BY b.created_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'status', p.status,
            'createdAt', p.created_at,
            'expiresAt', p.expires_at,
            'applicantCount', p.applicant_count,
            'viewCount', p.view_count
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260531_025
-- =============================================================================
