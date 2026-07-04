-- Migration 057: Fix create_job RPC to accept p_position_title

-- Drop the old function since the argument list changes
DROP FUNCTION IF EXISTS public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT,
    BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT,
    BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
);

-- Recreate with p_position_title added
CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT, p_description TEXT, p_requirements TEXT,
    p_province_id BIGINT, p_ward_id BIGINT,
    p_salary_min BIGINT, p_salary_max BIGINT, p_salary_visible BOOLEAN,
    p_job_type_id BIGINT, p_work_mode_id BIGINT, p_job_position_id BIGINT,
    p_position_title TEXT, p_status TEXT, p_expires_at TIMESTAMPTZ, p_skills TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_status TEXT; v_job_id BIGINT;
    v_skill_name TEXT; v_skill_id BIGINT; v_pos_title TEXT;
BEGIN
    SELECT u.id, u.role, u.status INTO v_me, v_role, v_status FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    IF btrim(COALESCE(p_title, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle'); END IF;
    IF char_length(btrim(p_title)) > 255 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong'); END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription'); END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange'); END IF;
    IF p_status NOT IN ('draft', 'active') THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode'); END IF;
    IF p_province_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince'); END IF;

    v_pos_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_pos_title IS NOT NULL AND char_length(v_pos_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong'); END IF;

    INSERT INTO public.jobs(company_user_id, title, description, requirements,
        province_id, ward_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, position_title, status, expires_at)
    VALUES (v_me, btrim(p_title), btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_ward_id, p_salary_min, p_salary_max, COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, v_pos_title, p_status, p_expires_at)
    RETURNING id INTO v_job_id;

    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;
            SELECT id INTO v_skill_id FROM public.skills WHERE name = v_skill_name LIMIT 1;
            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_id;
            END IF;
            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (v_job_id, v_skill_id, TRUE) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'jobId', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT, BIGINT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;
