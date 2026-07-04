-- =============================================================================
-- 20260601_027_update_job.sql
-- Lý do: company chỉ có thể tạo tin (create_job) + đổi trạng thái
-- (update_job_status) nhưng KHÔNG sửa được nội dung tin đã đăng. Bổ sung:
--   • get_job_for_edit() → owner-only, trả các field dạng ID (province/jobType/
--     workMode) + skills để prefill form sửa (get_job_detail chỉ trả tên).
--   • update_job()        → owner-only, cập nhật toàn bộ nội dung + thay skills.
-- Mirror create_job (validate giống hệt) nhưng thêm check chủ sở hữu.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RPC: get_job_for_edit — owner-only, trả field ID để prefill form.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_job_for_edit(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_job JSONB;
    v_skills JSONB;
    v_company_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    IF v_me IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'id', j.id,
        'title', j.title,
        'description', j.description,
        'requirements', j.requirements,
        'provinceId', j.province_id,
        'wardId', j.ward_id,
        'salaryMin', j.salary_min,
        'salaryMax', j.salary_max,
        'salaryVisible', j.salary_visible,
        'jobTypeId', j.job_type_id,
        'workModeId', j.work_mode_id,
        'positionTitle', j.position_title,
        'status', j.status,
        'expiresAt', j.expires_at
    ), j.company_user_id
    INTO v_job, v_company_user_id
    FROM public.jobs j
    WHERE j.id = p_job_id
      AND j.deleted_at IS NULL;

    -- Không tìm thấy hoặc không phải chủ tin → NULL (route tự notFound).
    IF v_job IS NULL OR v_company_user_id <> v_me THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb)
      INTO v_skills
      FROM public.job_skills js
      JOIN public.skills s ON s.id = js.skill_id
     WHERE js.job_id = p_job_id;

    RETURN jsonb_build_object('job', v_job, 'skills', v_skills);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_for_edit(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. RPC: update_job — owner-only, cập nhật NỘI DUNG tin + thay toàn bộ skills.
--    Validate giống create_job. CỐ Ý không đụng cột `status`: chuyển trạng thái
--    (draft↔active↔closed) do update_job_status quản lý riêng ở dashboard, nên
--    sửa nội dung một tin đã đóng/hết hạn không vô tình mở lại.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_job(
    p_job_id BIGINT,
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
    p_position_title TEXT,
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
    v_company_user_id BIGINT;
    v_old_status TEXT;
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

    UPDATE public.jobs
       SET title = btrim(p_title),
           description = btrim(p_description),
           requirements = NULLIF(btrim(COALESCE(p_requirements, '')), ''),
           province_id = p_province_id,
           ward_id = p_ward_id,
           salary_min = p_salary_min,
           salary_max = p_salary_max,
           salary_visible = COALESCE(p_salary_visible, TRUE),
           job_type_id = p_job_type_id,
           work_mode_id = p_work_mode_id,
           position_title = v_position_title,
           expires_at = p_expires_at,
           updated_at = NOW()
     WHERE id = p_job_id;

    -- Thay toàn bộ skills: xoá hết rồi chèn lại theo danh sách mới.
    DELETE FROM public.job_skills WHERE job_id = p_job_id;

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
            VALUES (p_job_id, v_skill_id, TRUE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'jobId', p_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job(
    BIGINT, TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN,
    BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;
