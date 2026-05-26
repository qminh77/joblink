-- =============================================================================
-- JOBLINK MIGRATION 20260527_016 — COMPANY PUBLIC PAGE (M04)
-- =============================================================================
-- Mục tiêu:
--   • Index hot path: list jobs đang mở của 1 công ty (trang public).
--   • RPC tổng hợp `get_company_public_overview` — 1 round trip lấy toàn bộ
--     dữ liệu cho /company/[id]: core company info, jobs preview, follower
--     count, viewer-is-following, is_owner. Tránh client gọi 4-5 query rời.
--   • RPC `toggle_follow_company` — idempotent toggle + trả về count mới để
--     UI cập nhật optimistic không cần round-trip phụ.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- List/đếm active jobs của 1 công ty theo "mới nhất". Partial index giảm size
-- vì non-active job không bao giờ xuất hiện ở trang public.
CREATE INDEX IF NOT EXISTS idx_jobs_company_active_created
    ON public.jobs(company_user_id, created_at DESC)
    WHERE status = 'active' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: get_company_public_overview
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

    -- Core company info. Trả NULL nếu công ty không tồn tại / bị khóa / bị xoá.
    SELECT jsonb_build_object(
        'userId', u.id,
        'companyId', cp.id,
        'name', cp.name,
        'slug', cp.slug,
        'logoUrl', cp.logo_url,
        'about', cp.about,
        'website', cp.website,
        'industry', cp.industry,
        'size', cp.size,
        'openToHire', cp.open_to_hire,
        'verificationStatus', cp.verification_status,
        'provinceName', pv.name,
        'districtName', dt.name,
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
    LEFT JOIN public.districts dt ON dt.id = cp.district_id
    WHERE u.id = p_company_user_id
      AND u.deleted_at IS NULL
      AND u.role = 'company'
      AND u.status = 'active';

    IF v_company IS NULL THEN
        RETURN NULL;
    END IF;

    -- Đếm jobs đang mở (active + chưa hết hạn).
    SELECT COUNT(*)::INT
      INTO v_jobs_count
      FROM public.jobs j
     WHERE j.company_user_id = p_company_user_id
       AND j.status = 'active'
       AND j.deleted_at IS NULL
       AND (j.expires_at IS NULL OR j.expires_at > NOW());

    -- Top N jobs gần nhất kèm location/type/mode để render thẻ ngay không cần
    -- gọi tiếp.
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'salaryMin', x.salary_min,
            'salaryMax', x.salary_max,
            'salaryVisible', x.salary_visible,
            'provinceName', x.province_name,
            'districtName', x.district_name,
            'jobTypeName', x.job_type_name,
            'workModeName', x.work_mode_name,
            'createdAt', x.created_at
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_jobs
    FROM (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               pv.name AS province_name,
               dt.name AS district_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               j.created_at
          FROM public.jobs j
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.districts dt ON dt.id = j.district_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.company_user_id = p_company_user_id
           AND j.status = 'active'
           AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
         ORDER BY j.created_at DESC
         LIMIT v_jobs_lim
    ) x;

    -- Follower count. Không cache trên users vì follows chưa đủ nóng để cần
    -- counter cache; COUNT có idx_follows_target hỗ trợ.
    SELECT COUNT(*)::INT
      INTO v_follower_count
      FROM public.follows f
     WHERE f.followable_type = 'company'
       AND f.followable_id = p_company_user_id;

    -- Viewer's follow relation. Anon/self → FALSE (UI sẽ render nút "Theo dõi"
    -- không enable nếu là chính mình; check thêm ở client).
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

-- -----------------------------------------------------------------------------
-- 3. RPC: toggle_follow_company
--    Idempotent: gọi 2 lần ⇒ về trạng thái ban đầu. Trả luôn count mới để UI
--    optimistic không cần fetch lại overview.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_follow_company(
    p_company_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_target_role TEXT;
    v_target_status TEXT;
    v_existing BIGINT;
    v_is_following BOOLEAN;
    v_count INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF v_me = p_company_user_id THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow');
    END IF;

    SELECT u.role, u.status
      INTO v_target_role, v_target_status
      FROM public.users u
     WHERE u.id = p_company_user_id
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound');
    END IF;
    IF v_target_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;
    IF v_target_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive');
    END IF;

    SELECT id INTO v_existing
      FROM public.follows
     WHERE follower_id = v_me
       AND followable_type = 'company'
       AND followable_id = p_company_user_id
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
        DELETE FROM public.follows WHERE id = v_existing;
        v_is_following := FALSE;
    ELSE
        INSERT INTO public.follows(follower_id, followable_type, followable_id)
        VALUES (v_me, 'company', p_company_user_id)
        ON CONFLICT (follower_id, followable_type, followable_id) DO NOTHING;
        v_is_following := TRUE;
    END IF;

    SELECT COUNT(*)::INT
      INTO v_count
      FROM public.follows
     WHERE followable_type = 'company'
       AND followable_id = p_company_user_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'isFollowing', v_is_following,
        'followerCount', v_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_company(BIGINT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260527_016
-- =============================================================================
