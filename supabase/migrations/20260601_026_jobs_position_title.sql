-- =============================================================================
-- 20260601_026_jobs_position_title.sql
-- Lý do: master table job_positions quá cứng. Form đăng tin cho phép company
-- nhập tự do vị trí (e.g. "Senior React Engineer") → thêm cột position_title
-- và cho RPC create_job nhận thêm p_position_title.
-- Cột cũ job_position_id giữ lại NULL cho dữ liệu cũ + tham chiếu admin, sẽ
-- không bị form mới ghi nữa.
-- =============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS position_title VARCHAR(255) NULL;

-- DROP RPC cũ (param signature đổi → phải drop trước khi tạo lại).
DROP FUNCTION IF EXISTS public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN,
    BIGINT, BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
);

CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT,
    p_description TEXT,
    p_requirements TEXT,
    p_province_id BIGINT,
    p_district_id BIGINT,
    p_salary_min BIGINT,
    p_salary_max BIGINT,
    p_salary_visible BOOLEAN,
    p_job_type_id BIGINT,
    p_work_mode_id BIGINT,
    p_job_position_id BIGINT,
    p_position_title TEXT,
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
    v_position_title TEXT;
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

    v_position_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_position_title IS NOT NULL AND char_length(v_position_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong');
    END IF;

    INSERT INTO public.jobs(
        company_user_id, title, description, requirements,
        province_id, district_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, position_title,
        status, expires_at
    ) VALUES (
        v_me,
        btrim(p_title),
        btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_district_id, p_salary_min, p_salary_max,
        COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, v_position_title,
        p_status, p_expires_at
    )
    RETURNING id INTO v_job_id;

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
    BIGINT, BIGINT, BIGINT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- get_job_detail: trả thêm positionTitle (đọc từ cột position_title mới).
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
        'districtName', dt.name,
        'jobTypeName', jt.name,
        'workModeName', wm.name,
        'jobPositionName', jp.name,
        'positionTitle', j.position_title
    ), j.company_user_id
    INTO v_job, v_company_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = j.company_user_id
    LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = j.province_id
    LEFT JOIN public.districts dt ON dt.id = j.district_id
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
