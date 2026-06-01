-- =============================================================================
-- JOBLINK MIGRATION 20260528_021 — COMPANY PHONE + PUBLIC OVERVIEW PHONE
-- =============================================================================
-- Mục tiêu:
--   • Thêm cột `phone` cho company_profiles (số điện thoại liên hệ doanh nghiệp).
--   • Cập nhật RPC `get_company_public_overview` để trả thêm `phone` cho trang
--     public + view hồ sơ công ty.
-- Lưu ý: bảng follows, RLS follows, RPC toggle_follow_company đã tồn tại từ
--   migration 016 — không đụng tới ở đây.
-- =============================================================================

ALTER TABLE public.company_profiles
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- -----------------------------------------------------------------------------
-- Recreate get_company_public_overview để thêm trường `phone`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_public_overview(
    p_company_user_id BIGINT,
    p_jobs_limit INT DEFAULT 8
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_company JSONB;
    v_jobs JSONB;
    v_follower_count INT;
    v_jobs_count INT;
    v_is_following BOOLEAN;
    v_jobs_lim INT;
BEGIN
    v_jobs_lim := GREATEST(LEAST(COALESCE(p_jobs_limit, 8), 50), 1);

    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    SELECT jsonb_build_object(
        'userId', u.id,
        'companyId', cp.id,
        'name', cp.name,
        'slug', cp.slug,
        'logoUrl', cp.logo_url,
        'about', cp.about,
        'website', cp.website,
        'phone', cp.phone,
        'industry', cp.industry,
        'size', cp.size,
        'openToHire', cp.open_to_hire,
        'verificationStatus', cp.verification_status,
        'provinceName', pv.name,
        'wardName', dt.name,
        'businessAddress', cp.business_address,
        'businessEmail', cp.business_email,
        'representativeName', cp.representative_name,
        'representativeTitle', cp.representative_title,
        'createdAt', cp.created_at
    )
    INTO v_company
    FROM public.users u
    JOIN public.company_profiles cp
      ON cp.user_id = u.id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = cp.province_id
    LEFT JOIN public.wards dt ON dt.id = cp.ward_id
    WHERE u.id = p_company_user_id
      AND u.deleted_at IS NULL
      AND u.role = 'company'
      AND u.status = 'active';

    IF v_company IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*)::INT
      INTO v_jobs_count
      FROM public.jobs j
     WHERE j.company_user_id = p_company_user_id
       AND j.status = 'active'
       AND j.deleted_at IS NULL
       AND (j.expires_at IS NULL OR j.expires_at > NOW());

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'salaryMin', x.salary_min,
            'salaryMax', x.salary_max,
            'salaryVisible', x.salary_visible,
            'provinceName', x.province_name,
            'wardName', x.ward_name,
            'jobTypeName', x.job_type_name,
            'workModeName', x.work_mode_name,
            'createdAt', x.created_at
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_jobs
    FROM (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               pv.name AS province_name,
               dt.name AS ward_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               j.created_at
          FROM public.jobs j
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.company_user_id = p_company_user_id
           AND j.status = 'active'
           AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
         ORDER BY j.created_at DESC
         LIMIT v_jobs_lim
    ) x;

    SELECT COUNT(*)::INT
      INTO v_follower_count
      FROM public.follows f
     WHERE f.followable_type = 'company'
       AND f.followable_id = p_company_user_id;

    IF v_me IS NULL OR v_me = p_company_user_id THEN
        v_is_following := FALSE;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM public.follows f
             WHERE f.follower_id = v_me
               AND f.followable_type = 'company'
               AND f.followable_id = p_company_user_id
        ) INTO v_is_following;
    END IF;

    RETURN jsonb_build_object(
        'company', v_company,
        'jobsCount', v_jobs_count,
        'followerCount', v_follower_count,
        'isFollowing', COALESCE(v_is_following, FALSE),
        'isOwner', COALESCE(v_me = p_company_user_id, FALSE),
        'jobs', v_jobs
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public_overview(BIGINT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260528_021
-- =============================================================================
