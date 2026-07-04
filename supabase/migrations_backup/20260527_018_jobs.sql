-- =============================================================================
-- JOBLINK MIGRATION 20260527_018 — JOBS (M05 candidate-facing) + APPLICATIONS
-- =============================================================================
-- Mục tiêu:
--   • Index hot path cho job listing + ILIKE search title.
--   • RPCs:
--       - create_job()            → recruiter đăng tin (kèm skills)
--       - get_jobs_list()         → list/search có filter cho ứng viên
--       - get_job_detail()        → 1 round-trip cho /jobs/[id]
--       - apply_to_job()          → member ứng tuyển + notify recruiter
--       - withdraw_application()  → member rút đơn
--       - toggle_saved_job()      → member bookmark/unbookmark
--       - get_my_saved_jobs()     → list bookmarks của member
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- ILIKE trên title cho search. pg_trgm đã enable ở migration network_perf.
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm
    ON public.jobs USING gin (title gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Sort hot path: status='active' + created_at DESC. Đã có idx_jobs_active_company
-- nhưng thiếu created_at — thêm partial.
CREATE INDEX IF NOT EXISTS idx_jobs_active_created
    ON public.jobs(created_at DESC)
    WHERE status = 'active' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: create_job
--    Recruiter only. Skills truyền theo tên (array). RPC sẽ find-or-create
--    rows trong public.skills rồi insert job_skills.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT,
    p_description TEXT,
    p_requirements TEXT,
    p_province_id BIGINT,
    p_ward_id BIGINT,
    p_salary_min BIGINT,
    p_salary_max BIGINT,
    p_salary_visible BOOLEAN,
    p_job_type_id BIGINT,
    p_work_mode_id BIGINT,
    p_job_position_id BIGINT,
    p_status TEXT,
    p_expires_at TIMESTAMPTZ,
    p_skills TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_status TEXT;
    v_job_id BIGINT;
    v_skill_name TEXT;
    v_skill_id BIGINT;
BEGIN
    SELECT u.id, u.role, u.status INTO v_me, v_role, v_status
      FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;
    IF v_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive');
    END IF;

    -- Validate cơ bản (RPC server-side, khớp với client zod).
    IF btrim(COALESCE(p_title, '')) = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle');
    END IF;
    IF char_length(btrim(p_title)) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong');
    END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription');
    END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL
       AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange');
    END IF;
    IF p_status NOT IN ('draft', 'active') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    -- FK guards: tránh insert lỗi.
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode');
    END IF;
    IF p_province_id IS NOT NULL
       AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince');
    END IF;

    INSERT INTO public.jobs(
        company_user_id, title, description, requirements,
        province_id, ward_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, status, expires_at
    ) VALUES (
        v_me,
        btrim(p_title),
        btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_ward_id, p_salary_min, p_salary_max,
        COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, p_status, p_expires_at
    )
    RETURNING id INTO v_job_id;

    -- Skills: find-or-create theo name (case-sensitive UNIQUE), bỏ qua duplicate.
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;

            SELECT id INTO v_skill_id FROM public.skills
             WHERE name = v_skill_name LIMIT 1;

            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id INTO v_skill_id;
            END IF;

            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (v_job_id, v_skill_id, TRUE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'jobId', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN,
    BIGINT, BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_jobs_list
--    Public job board. Filter: search (ILIKE title), province, job types,
--    work modes, salary range. Pagination offset/limit. Trả thêm
--    viewerSaved/viewerApplied để UI hiển thị state đúng.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_jobs_list(
    p_search TEXT DEFAULT NULL,
    p_province_id BIGINT DEFAULT NULL,
    p_job_type_ids BIGINT[] DEFAULT NULL,
    p_work_mode_ids BIGINT[] DEFAULT NULL,
    p_salary_min BIGINT DEFAULT NULL,
    p_company_user_id BIGINT DEFAULT NULL,
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
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
    v_q TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               j.created_at, j.expires_at,
               j.company_user_id,
               j.province_id, j.ward_id,
               j.job_type_id, j.work_mode_id,
               pv.name AS province_name,
               dt.name AS ward_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url,
               cp.verification_status AS company_verification_status
          FROM public.jobs j
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.status = 'active'
           AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
           AND (p_province_id IS NULL OR j.province_id = p_province_id)
           AND (p_job_type_ids IS NULL OR j.job_type_id = ANY(p_job_type_ids))
           AND (p_work_mode_ids IS NULL OR j.work_mode_id = ANY(p_work_mode_ids))
           AND (p_salary_min IS NULL OR COALESCE(j.salary_max, j.salary_min) >= p_salary_min)
           AND (p_company_user_id IS NULL OR j.company_user_id = p_company_user_id)
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base
         ORDER BY created_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'salaryMin', p.salary_min,
            'salaryMax', p.salary_max,
            'salaryVisible', p.salary_visible,
            'createdAt', p.created_at,
            'expiresAt', p.expires_at,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'companyVerified', p.company_verification_status = 'verified',
            'provinceName', p.province_name,
            'wardName', p.ward_name,
            'jobTypeName', p.job_type_name,
            'workModeName', p.work_mode_name,
            'viewerSaved', v_me IS NOT NULL AND EXISTS(
                SELECT 1 FROM public.saved_jobs s
                 WHERE s.user_id = v_me AND s.job_id = p.id
            ),
            'viewerApplied', v_me IS NOT NULL AND EXISTS(
                SELECT 1 FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p.id
            )
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_jobs_list(
    TEXT, BIGINT, BIGINT[], BIGINT[], BIGINT, BIGINT, INT, INT
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: get_job_detail
--    1 round-trip cho trang /jobs/[id]: job core, company, skills, viewer
--    state (isOwner, viewerSaved, viewerApplied, applicationStatus).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_job_detail(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_job JSONB;
    v_skills JSONB;
    v_viewer JSONB;
    v_company_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    SELECT jsonb_build_object(
        'id', j.id,
        'title', j.title,
        'description', j.description,
        'requirements', j.requirements,
        'salaryMin', j.salary_min,
        'salaryMax', j.salary_max,
        'salaryVisible', j.salary_visible,
        'status', j.status,
        'createdAt', j.created_at,
        'expiresAt', j.expires_at,
        'companyUserId', j.company_user_id,
        'companyName', COALESCE(cp.name, u.email),
        'companyLogoUrl', cp.logo_url,
        'companyIndustry', cp.industry,
        'companyAbout', cp.about,
        'companySize', cp.size,
        'companyVerified', cp.verification_status = 'verified',
        'provinceName', pv.name,
        'wardName', dt.name,
        'jobTypeName', jt.name,
        'workModeName', wm.name,
        'jobPositionName', jp.name
    ), j.company_user_id
    INTO v_job, v_company_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = j.company_user_id
    LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = j.province_id
    LEFT JOIN public.wards dt ON dt.id = j.ward_id
    LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
    LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
    LEFT JOIN public.job_positions jp ON jp.id = j.job_position_id
    WHERE j.id = p_job_id
      AND j.deleted_at IS NULL;

    IF v_job IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb)
      INTO v_skills
      FROM public.job_skills js
      JOIN public.skills s ON s.id = js.skill_id
     WHERE js.job_id = p_job_id;

    -- Viewer state
    IF v_me IS NULL THEN
        v_viewer := jsonb_build_object(
            'isOwner', FALSE,
            'viewerSaved', FALSE,
            'viewerApplied', FALSE,
            'applicationStatus', NULL,
            'applicationId', NULL
        );
    ELSE
        v_viewer := jsonb_build_object(
            'isOwner', v_me = v_company_user_id,
            'viewerSaved', EXISTS(
                SELECT 1 FROM public.saved_jobs s
                 WHERE s.user_id = v_me AND s.job_id = p_job_id
            ),
            'viewerApplied', EXISTS(
                SELECT 1 FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id
            ),
            'applicationStatus', (
                SELECT a.status FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1
            ),
            'applicationId', (
                SELECT a.id FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'job', v_job,
        'skills', v_skills,
        'viewer', v_viewer
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_detail(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: apply_to_job
--    Member-only. Job phải active + chưa hết hạn. UNIQUE (job_id, applicant_id)
--    chặn nộp trùng. Insert history row vì applied là trạng thái khởi tạo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT,
    p_cover_letter TEXT,
    p_resume_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_job_status TEXT;
    v_job_expires TIMESTAMPTZ;
    v_application_id BIGINT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'member' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly');
    END IF;

    SELECT status, expires_at INTO v_job_status, v_job_expires
      FROM public.jobs
     WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;

    IF v_job_status IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;
    IF v_job_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotActive');
    END IF;
    IF v_job_expires IS NOT NULL AND v_job_expires <= NOW() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobExpired');
    END IF;

    IF EXISTS(SELECT 1 FROM public.job_applications
               WHERE job_id = p_job_id AND applicant_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'alreadyApplied');
    END IF;

    IF p_cover_letter IS NOT NULL AND char_length(p_cover_letter) > 5000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'coverLetterTooLong');
    END IF;

    INSERT INTO public.job_applications(
        job_id, applicant_id, resume_url, cover_letter, status
    ) VALUES (
        p_job_id, v_me,
        NULLIF(btrim(COALESCE(p_resume_url, '')), ''),
        NULLIF(btrim(COALESCE(p_cover_letter, '')), ''),
        'applied'
    )
    RETURNING id INTO v_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note
    ) VALUES (
        v_application_id, NULL, 'applied', v_me, NULL
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'applicationId', v_application_id,
        'status', 'applied'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(BIGINT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: withdraw_application
--    Member-only, chỉ chủ đơn được rút. Không cho rút khi đã 'hired' (kết quả
--    cuối) — tránh xoá nhầm trên dashboard recruiter.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_application(p_application_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_applicant BIGINT;
    v_old_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT applicant_id, status INTO v_applicant, v_old_status
      FROM public.job_applications WHERE id = p_application_id LIMIT 1;
    IF v_applicant IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound');
    END IF;
    IF v_applicant <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;
    IF v_old_status IN ('withdrawn','hired','rejected') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdrawNow');
    END IF;

    UPDATE public.job_applications
       SET status = 'withdrawn', updated_at = NOW()
     WHERE id = p_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note
    ) VALUES (
        p_application_id, v_old_status, 'withdrawn', v_me, NULL
    );

    RETURN jsonb_build_object('ok', TRUE, 'status', 'withdrawn');
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_application(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: toggle_saved_job  (idempotent bookmark)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_saved_job(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_existing INT;
    v_saved BOOLEAN;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'member' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly');
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.jobs
                   WHERE id = p_job_id AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    SELECT 1 INTO v_existing FROM public.saved_jobs
     WHERE user_id = v_me AND job_id = p_job_id LIMIT 1;

    IF v_existing IS NOT NULL THEN
        DELETE FROM public.saved_jobs
         WHERE user_id = v_me AND job_id = p_job_id;
        v_saved := FALSE;
    ELSE
        INSERT INTO public.saved_jobs(user_id, job_id)
        VALUES (v_me, p_job_id)
        ON CONFLICT DO NOTHING;
        v_saved := TRUE;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'saved', v_saved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_saved_job(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: get_my_saved_jobs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_saved_jobs(
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

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);

    WITH base AS (
        SELECT s.created_at AS saved_at,
               j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               j.status, j.created_at AS job_created_at, j.expires_at,
               j.company_user_id,
               COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url,
               pv.name AS province_name,
               dt.name AS ward_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name
          FROM public.saved_jobs s
          JOIN public.jobs j ON j.id = s.job_id AND j.deleted_at IS NULL
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE s.user_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base ORDER BY saved_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'salaryMin', p.salary_min,
            'salaryMax', p.salary_max,
            'salaryVisible', p.salary_visible,
            'jobStatus', p.status,
            'savedAt', p.saved_at,
            'createdAt', p.job_created_at,
            'expiresAt', p.expires_at,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'provinceName', p.province_name,
            'wardName', p.ward_name,
            'jobTypeName', p.job_type_name,
            'workModeName', p.work_mode_name
        ) ORDER BY p.saved_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_saved_jobs(INT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260527_018
-- =============================================================================
