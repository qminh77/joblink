-- =============================================================================
-- JOBLINK MIGRATION 20260528_022 — PROFILE DETAIL RPC
-- =============================================================================
-- Mục tiêu:
--   • Gộp toàn bộ query của trang xem hồ sơ /profile/[id] về MỘT round-trip
--     duy nhất, giống pattern get_home_feed / get_network_overview /
--     get_company_public_overview.
--   • Trước đây loadProfileById chạy waterfall: users → (member: profile + exp +
--     edu + skills) hoặc (company: profile + follower + viewerFollow) + một query
--     connection riêng ở loadConnectionRelation. Tất cả gộp vào get_profile_detail.
--   • Logic visibility/relation giữ nguyên 100% so với code TS cũ:
--       - member isVisible = (profile_visibility <> 'private') OR isOwner.
--         Khi không visible: experiences/educations/skills trả mảng rỗng.
--       - relation lookup theo cả hai chiều (requester/receiver), limit 1.
-- Ghi chú: các bảng core (users, *_profiles, connections, follows...) KHÔNG bật
--   RLS — app tự enforce visibility — nên SECURITY INVOKER an toàn, hành vi đọc
--   y hệt client anon-key hiện tại.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_detail(
    p_target_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me            BIGINT;
    v_target        public.users%ROWTYPE;
    v_is_owner      BOOLEAN;
    v_relation      JSONB;
    v_conn          RECORD;
    v_profile       JSONB;
    v_province      JSONB;
    v_district      JSONB;
    v_is_visible    BOOLEAN;
    v_experiences   JSONB;
    v_educations    JSONB;
    v_skills        JSONB;
    v_follower_cnt  INT;
    v_is_following  BOOLEAN;
    v_visibility    TEXT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_target
      FROM public.users u
     WHERE u.id = p_target_user_id
       AND u.deleted_at IS NULL;

    IF v_target.id IS NULL THEN
        RETURN NULL;
    END IF;

    v_is_owner := (v_me = v_target.id);

    -- ---- Connection relation (hai chiều) -----------------------------------
    IF v_is_owner THEN
        v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn
          FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me)
         LIMIT 1;

        IF v_conn.id IS NULL THEN
            v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN
            v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN
            v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN
            v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE
            v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id);
        END IF;
    END IF;

    -- ============================ COMPANY ===================================
    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile
          FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id
           AND cp.deleted_at IS NULL;

        IF v_profile IS NULL THEN
            RETURN NULL;
        END IF;

        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp
          JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_district
          FROM public.company_profiles cp
          JOIN public.districts dt ON dt.id = cp.district_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT COUNT(*)::INT INTO v_follower_cnt
          FROM public.follows f
         WHERE f.followable_type = 'company'
           AND f.followable_id = v_target.id;

        IF v_is_owner THEN
            v_is_following := FALSE;
        ELSE
            SELECT EXISTS(
                SELECT 1 FROM public.follows f
                 WHERE f.follower_id = v_me
                   AND f.followable_type = 'company'
                   AND f.followable_id = v_target.id
            ) INTO v_is_following;
        END IF;

        RETURN jsonb_build_object(
            'kind', 'company',
            'isOwner', v_is_owner,
            'relation', v_relation,
            'profile', v_profile,
            'email', v_target.email,
            'province', v_province,
            'district', v_district,
            'profileViewCount', v_target.profile_view_count,
            'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0),
            'isFollowing', COALESCE(v_is_following, FALSE)
        );
    END IF;

    -- ============================ MEMBER ====================================
    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id
       AND mp.deleted_at IS NULL;

    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp
      JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_district
      FROM public.member_profiles mp
      JOIN public.districts dt ON dt.id = mp.district_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := (v_visibility IS DISTINCT FROM 'private') OR v_is_owner;

    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences
          FROM public.member_experiences e
         WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations
          FROM public.member_educations ed
         WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name)), '[]'::jsonb)
          INTO v_skills
          FROM public.member_skills ms
          JOIN public.skills s ON s.id = ms.skill_id
         WHERE ms.user_id = v_target.id;
    ELSE
        v_experiences := '[]'::jsonb;
        v_educations  := '[]'::jsonb;
        v_skills      := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object(
        'kind', 'member',
        'isOwner', v_is_owner,
        'relation', v_relation,
        'profile', v_profile,
        'email', v_target.email,
        'province', v_province,
        'district', v_district,
        'profileViewCount', v_target.profile_view_count,
        'connectionCount', v_target.connection_count,
        'isVisible', v_is_visible,
        'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb),
        'skills', COALESCE(v_skills, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260528_022
-- =============================================================================
