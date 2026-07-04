-- =============================================================================
-- JOBLINK MIGRATION 20260527_017 — COMPANY DASHBOARD (M05 owner-facing)
-- =============================================================================
-- Mục tiêu:
--   • Index hot path cho dashboard recruiter (jobs theo status, applications
--     join jobs theo công ty).
--   • RPC tổng hợp `get_company_dashboard_overview` — 1 round trip cho tab
--     Tổng quan (stats + recent jobs + recent applicants).
--   • RPC `get_company_jobs` — phân trang + lọc theo status + search.
--   • RPC `get_company_applicants` — phân trang + lọc theo job_id/status +
--     search theo tên ứng viên. Dùng cho cả tab Ứng viên và tab Pipeline.
--   • RPC `update_application_status` + `update_job_status` — owner-only,
--     insert history row, ghi nhận `changed_by`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- Lọc applications theo job + status (pipeline view). Đã có idx_job_apps_job
-- và idx_job_apps_status riêng — thêm composite + applied_at DESC để pipeline
-- sort newest-first không cần resort.
CREATE INDEX IF NOT EXISTS idx_job_apps_job_status_applied
    ON public.job_applications(job_id, status, applied_at DESC);

-- Lọc jobs của 1 công ty theo status + created_at DESC (jobs tab).
CREATE INDEX IF NOT EXISTS idx_jobs_company_status_created
    ON public.jobs(company_user_id, status, created_at DESC)
    WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: get_company_dashboard_overview
--    Yêu cầu: viewer phải là chính company user (owner-only). Trả NULL nếu
--    role != company hoặc không khớp.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_active_jobs INT;
    v_total_apps INT;
    v_apps_this_month INT;
    v_hires_total INT;
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

    -- Stats
    SELECT COUNT(*)::INT
      INTO v_active_jobs
      FROM public.jobs j
     WHERE j.company_user_id = v_me
       AND j.status = 'active'
       AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT
      INTO v_total_apps
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT
      INTO v_apps_this_month
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());

    SELECT COUNT(*)::INT
      INTO v_hires_total
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL
       AND a.status = 'hired';

    -- Recent jobs (5)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'status', x.status,
            'createdAt', x.created_at,
            'expiresAt', x.expires_at,
            'applicantCount', x.applicant_count
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_jobs
    FROM (
        SELECT j.id, j.title, j.status, j.created_at, j.expires_at,
               COALESCE((
                   SELECT COUNT(*)::INT FROM public.job_applications a
                    WHERE a.job_id = j.id
               ), 0) AS applicant_count
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
         ORDER BY j.created_at DESC
         LIMIT 5
    ) x;

    -- Recent applicants (5)
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
        SELECT a.id AS application_id,
               a.applicant_id,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline,
               j.id AS job_id,
               j.title AS job_title,
               a.status,
               a.applied_at
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
         ORDER BY a.applied_at DESC
         LIMIT 5
    ) x;

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'activeJobs', v_active_jobs,
            'totalApplications', v_total_apps,
            'applicationsThisMonth', v_apps_this_month,
            'hireRate', CASE
                WHEN v_total_apps > 0
                THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1)
                ELSE 0
            END
        ),
        'recentJobs', v_recent_jobs,
        'recentApplicants', v_recent_apps
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_company_jobs
--    Filter: status ('all'|'active'|'draft'|'closed'|'expired'), search (ILIKE
--    trên title). Phân trang offset/limit (đủ cho dashboard, không cần cursor).
-- -----------------------------------------------------------------------------
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
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.*
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_status = 'all' OR j.status = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (
        SELECT COUNT(*)::INT AS total FROM base
    ),
    page AS (
        SELECT b.id, b.title, b.status, b.created_at, b.expires_at,
               COALESCE((
                   SELECT COUNT(*)::INT FROM public.job_applications a
                    WHERE a.job_id = b.id
               ), 0) AS applicant_count
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
            'applicantCount', p.applicant_count
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: get_company_applicants
--    Filter: job_id (optional), status (optional, 'all' để bỏ qua), search.
--    Trả thêm thông tin job_title để hiển thị inline.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_applicants(
    p_job_id BIGINT DEFAULT NULL,
    p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
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
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT a.id AS application_id,
               a.applicant_id,
               a.status,
               a.applied_at,
               a.cover_letter,
               a.resume_url,
               j.id AS job_id,
               j.title AS job_title,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_job_id IS NULL OR a.job_id = p_job_id)
           AND (p_status = 'all' OR a.status = p_status)
           AND (
               v_q IS NULL
               OR COALESCE(mp.full_name, cp.name, u.email) ILIKE '%' || v_q || '%'
               OR j.title ILIKE '%' || v_q || '%'
           )
    ),
    counted AS (
        SELECT COUNT(*)::INT AS total FROM base
    ),
    page AS (
        SELECT * FROM base
         ORDER BY applied_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'applicationId', p.application_id,
            'applicantId', p.applicant_id,
            'displayName', p.display_name,
            'avatarUrl', p.avatar_url,
            'headline', p.headline,
            'jobId', p.job_id,
            'jobTitle', p.job_title,
            'status', p.status,
            'appliedAt', p.applied_at,
            'coverLetter', p.cover_letter,
            'resumeUrl', p.resume_url
        ) ORDER BY p.applied_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_applicants(BIGINT, TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: update_application_status
--    Owner-only (chính công ty tạo job). Insert vào history bằng cùng
--    transaction. Trigger history riêng có thể có sau; tạm thời insert trực
--    tiếp để giữ atomicity.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id BIGINT,
    p_new_status TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
    v_now TIMESTAMPTZ;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('applied','reviewed','interview','offered','hired','rejected','withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    SELECT j.company_user_id, a.status
      INTO v_company_user_id, v_old_status
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

    -- Withdrawn chỉ ứng viên tự đổi; recruiter không được dùng.
    IF p_new_status = 'withdrawn' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdraw');
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status);
    END IF;

    v_now := NOW();

    UPDATE public.job_applications
       SET status = p_new_status,
           updated_at = v_now
     WHERE id = p_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note, changed_at
    ) VALUES (
        p_application_id, v_old_status, p_new_status, v_me,
        NULLIF(btrim(COALESCE(p_note, '')), ''), v_now
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'noop', FALSE,
        'status', p_new_status,
        'oldStatus', v_old_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(BIGINT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: update_job_status
--    Owner-only. Cho phép: draft → active, active → closed, closed → active,
--    active → draft. Không cho chỉnh sang 'expired' (do hệ thống tự set) hay
--    'removed' (soft delete riêng).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_job_status(
    p_job_id BIGINT,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('draft','active','closed') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    SELECT j.company_user_id, j.status
      INTO v_company_user_id, v_old_status
      FROM public.jobs j
     WHERE j.id = p_job_id
       AND j.deleted_at IS NULL
     LIMIT 1;

    IF v_company_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    IF v_company_user_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;

    IF v_old_status = 'removed' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved');
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status);
    END IF;

    UPDATE public.jobs
       SET status = p_new_status,
           updated_at = NOW()
     WHERE id = p_job_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'noop', FALSE,
        'status', p_new_status,
        'oldStatus', v_old_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_status(BIGINT, TEXT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260527_017
-- =============================================================================
