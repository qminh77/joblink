-- =============================================================================
-- JOBLINK MIGRATION 20260528_027 — PROFILE EDIT OVERVIEW RPC
-- =============================================================================
-- Mục tiêu:
--   • Gộp 6 query của trang /profile/edit (profile + experiences + educations
--     + skills + provinces + cvs) thành MỘT round-trip.
--   • Trước đây Promise.all([loadOwnMemberProfile(), loadProvinces()]) tạo 6
--     query nội bộ — dù song song nhưng vẫn 2 round-trip mạng. RPC trả JSON
--     gộp giúp trang edit load nhanh hơn rõ rệt trên kết nối latency cao.
-- Bảng KHÔNG bật RLS → SECURITY INVOKER hợp lệ; hành vi giống client trực tiếp.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_edit_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me            BIGINT;
    v_email         TEXT;
    v_role          TEXT;
    v_profile       JSONB;
    v_province      JSONB;
    v_ward      JSONB;
    v_experiences   JSONB;
    v_educations    JSONB;
    v_skills        JSONB;
    v_cvs           JSONB;
    v_provinces     JSONB;
BEGIN
    SELECT u.id, u.email, u.role INTO v_me, v_email, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'member' THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_me
       AND mp.deleted_at IS NULL;

    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object('id', p.id, 'name', p.name) INTO v_province
      FROM public.provinces p
     WHERE p.id = (v_profile->>'province_id')::BIGINT
     LIMIT 1;

    SELECT jsonb_build_object('id', d.id, 'name', d.name) INTO v_ward
      FROM public.wards d
     WHERE d.id = (v_profile->>'ward_id')::BIGINT
     LIMIT 1;

    SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
      INTO v_experiences
      FROM public.member_experiences e
     WHERE e.user_id = v_me
       AND e.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC NULLS LAST), '[]'::jsonb)
      INTO v_educations
      FROM public.member_educations ed
     WHERE ed.user_id = v_me
       AND ed.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name)), '[]'::jsonb)
      INTO v_skills
      FROM public.member_skills ms
      JOIN public.skills s ON s.id = ms.skill_id
     WHERE ms.user_id = v_me;

    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.is_default DESC, c.created_at DESC), '[]'::jsonb)
      INTO v_cvs
      FROM public.member_cvs c
     WHERE c.user_id = v_me
       AND c.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(
             jsonb_build_object(
               'id', p.id,
               'code', p.code,
               'name', p.name,
               'name_en', p.name_en,
               'sort_order', p.sort_order,
               'is_active', p.is_active
             )
             ORDER BY p.sort_order, p.name
           ), '[]'::jsonb)
      INTO v_provinces
      FROM public.provinces p
     WHERE p.is_active = TRUE
       AND p.deleted_at IS NULL;

    RETURN jsonb_build_object(
        'userId', v_me,
        'email', v_email,
        'profile', v_profile,
        'province', v_province,
        'ward', v_ward,
        'experiences', v_experiences,
        'educations', v_educations,
        'skills', v_skills,
        'cvs', v_cvs,
        'provinces', v_provinces
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_edit_overview() TO authenticated;
