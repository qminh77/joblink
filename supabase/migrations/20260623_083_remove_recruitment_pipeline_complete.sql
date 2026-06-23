-- Migration 083: Xoá pipeline tuyển dụng + job_alerts (hoàn chỉnh)
--
-- Migration 073 đã loại bỏ pipeline nhưng migration 082 (RBAC simplify)
-- đã vô tình tạo lại các function pipeline với code cũ. Migration này
-- dọn dẹp triệt để: xoá bảng, function, policies, index, job_alerts,
-- và cập nhật các function còn lại dùng status mới (submitted/withdrawn/closed).

BEGIN;

-- =============================================================================
-- 1. Xoá RLS policies + index + bảng pipeline (nếu còn tồn tại)
--    Dùng DO block để tránh lỗi khi bảng đã bị xoá trước đó.
-- =============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'application_status_history' AND relnamespace = 'public'::regnamespace) THEN
    DROP POLICY IF EXISTS application_status_history_admin_all          ON public.application_status_history;
    DROP POLICY IF EXISTS application_status_history_select_visible     ON public.application_status_history;
    DROP POLICY IF EXISTS application_status_history_insert_company     ON public.application_status_history;
    DROP INDEX IF EXISTS idx_app_history_app;
    DROP TABLE IF EXISTS public.application_status_history CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'interview_schedules' AND relnamespace = 'public'::regnamespace) THEN
    DROP POLICY IF EXISTS interview_schedules_admin_all                 ON public.interview_schedules;
    DROP POLICY IF EXISTS interview_schedules_select_visible            ON public.interview_schedules;
    DROP POLICY IF EXISTS interview_schedules_insert_company            ON public.interview_schedules;
    DROP POLICY IF EXISTS interview_schedules_update_company            ON public.interview_schedules;
    DROP POLICY IF EXISTS interview_schedules_update_applicant_response ON public.interview_schedules;
    DROP INDEX IF EXISTS idx_interview_schedules_application;
    DROP TABLE IF EXISTS public.interview_schedules CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'job_alerts' AND relnamespace = 'public'::regnamespace) THEN
    DROP POLICY IF EXISTS job_alerts_admin_all     ON public.job_alerts;
    DROP POLICY IF EXISTS job_alerts_select_own    ON public.job_alerts;
    DROP POLICY IF EXISTS job_alerts_insert_own    ON public.job_alerts;
    DROP POLICY IF EXISTS job_alerts_update_own    ON public.job_alerts;
    DROP POLICY IF EXISTS job_alerts_delete_own    ON public.job_alerts;
    DROP INDEX IF EXISTS idx_job_alerts_user;
    DROP TABLE IF EXISTS public.job_alerts CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_job_apps_job_status_applied;

-- =============================================================================
-- 2. Xoá function pipeline (nếu migration 082 tạo lại)
-- =============================================================================
DROP FUNCTION IF EXISTS public.update_application_status(BIGINT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.schedule_interview(BIGINT, TIMESTAMPTZ, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.schedule_interview(BIGINT, TIMESTAMPTZ, INT, TEXT);
DROP FUNCTION IF EXISTS public.respond_interview(BIGINT, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_company_dashboard_overview();
DROP FUNCTION IF EXISTS public.get_company_jobs(TEXT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.get_company_applicants(BIGINT, TEXT, TEXT, INT, INT);

-- =============================================================================
-- 3. Cập nhật dữ liệu job_applications: chuyển status cũ -> submitted
-- =============================================================================
UPDATE public.job_applications
   SET status = 'submitted'
 WHERE status IN ('applied', 'reviewed', 'interview', 'offered', 'hired', 'rejected');

-- =============================================================================
-- 4. Cập nhật constraint job_applications
-- =============================================================================
ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS chk_app_status;

ALTER TABLE public.job_applications
  ADD CONSTRAINT chk_app_status CHECK (status IN ('submitted', 'withdrawn', 'closed'));

ALTER TABLE public.job_applications
  ALTER COLUMN status SET DEFAULT 'submitted';

-- =============================================================================
-- 5. apply_to_job: dùng 'submitted', không ghi application_status_history
-- =============================================================================
CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT, p_cover_letter TEXT, p_resume_url TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_job_status TEXT; v_job_expires TIMESTAMPTZ; v_application_id BIGINT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly'); END IF;
    SELECT status, expires_at INTO v_job_status, v_job_expires
      FROM public.jobs WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;
    IF v_job_status IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_job_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotActive'); END IF;
    IF v_job_expires IS NOT NULL AND v_job_expires <= NOW() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobExpired'); END IF;
    IF EXISTS(SELECT 1 FROM public.job_applications WHERE job_id = p_job_id AND applicant_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'alreadyApplied'); END IF;
    IF p_cover_letter IS NOT NULL AND char_length(p_cover_letter) > 5000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'coverLetterTooLong'); END IF;
    INSERT INTO public.job_applications(job_id, applicant_id, resume_url, cover_letter, status)
    VALUES (p_job_id, v_me, NULLIF(btrim(COALESCE(p_resume_url, '')), ''),
            NULLIF(btrim(COALESCE(p_cover_letter, '')), ''), 'submitted')
    RETURNING id INTO v_application_id;
    RETURN jsonb_build_object('ok', TRUE, 'applicationId', v_application_id, 'status', 'submitted');
END;
$$;

-- =============================================================================
-- 6. withdraw_application: dùng status mới
-- =============================================================================
CREATE OR REPLACE FUNCTION public.withdraw_application(p_application_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_applicant BIGINT; v_old_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    SELECT applicant_id, status INTO v_applicant, v_old_status
      FROM public.job_applications WHERE id = p_application_id LIMIT 1;
    IF v_applicant IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound'); END IF;
    IF v_applicant <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status IN ('withdrawn', 'closed') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdrawNow'); END IF;
    UPDATE public.job_applications SET status = 'withdrawn', updated_at = NOW() WHERE id = p_application_id;
    RETURN jsonb_build_object('ok', TRUE, 'status', 'withdrawn');
END;
$$;

-- =============================================================================
-- 7. get_my_applications: không có interview/history subqueries
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_applications(p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v_me BIGINT; v_items JSONB; v_total INT; v_lim INT; v_off INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    WITH base AS (
        SELECT a.id AS application_id, a.status, a.applied_at, a.updated_at,
               j.id AS job_id, j.title AS job_title, j.status AS job_status, j.company_user_id,
               COALESCE(cp.name, cu.email) AS company_name, cp.logo_url AS company_logo_url
          FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users cu ON cu.id = j.company_user_id
          LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
         WHERE a.applicant_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY updated_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', p.application_id, 'status', p.status,
        'appliedAt', p.applied_at, 'updatedAt', p.updated_at, 'jobId', p.job_id, 'jobTitle', p.job_title,
        'jobStatus', p.job_status, 'companyUserId', p.company_user_id, 'companyName', p.company_name,
        'companyLogoUrl', p.company_logo_url
    ) ORDER BY p.updated_at DESC), '[]'::jsonb), (SELECT total FROM counted)
      INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

-- =============================================================================
-- 8. Cập nhật GRANT cho các function còn dùng
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.apply_to_job(BIGINT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_application(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_applications(INT, INT) TO authenticated;

COMMIT;
