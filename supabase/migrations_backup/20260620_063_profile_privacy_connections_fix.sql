-- JOBLINK MIGRATION 20260620_063 — PROFILE PRIVACY CONNECTIONS FIX
-- - Enforce `profile_visibility = 'connections'` inside SECURITY DEFINER RPCs.
-- - Keep admin/owner full visibility while hiding member detail and profile posts
--   from non-connections.

CREATE OR REPLACE FUNCTION public.get_profile_detail(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_target public.users%ROWTYPE; v_is_owner BOOLEAN;
    v_relation JSONB; v_conn RECORD; v_profile JSONB;
    v_province JSONB; v_ward JSONB; v_is_visible BOOLEAN;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_follower_cnt INT; v_is_following BOOLEAN; v_visibility TEXT;
    v_is_connected BOOLEAN := FALSE; v_is_admin BOOLEAN := FALSE;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;
    SELECT * INTO v_target FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL;
    IF v_target.id IS NULL THEN RETURN NULL; END IF;
    v_is_owner := (v_me = v_target.id);
    v_is_admin := public.is_admin();

    IF v_is_owner THEN v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me) LIMIT 1;
        IF v_conn.id IS NULL THEN v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_is_connected := TRUE;
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id); END IF;
    END IF;

    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        IF v_profile IS NULL THEN RETURN NULL; END IF;
        IF NOT v_is_owner AND COALESCE(v_profile ->> 'verification_status', '') <> 'verified' THEN
            RETURN NULL;
        END IF;
        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
          FROM public.company_profiles cp JOIN public.wards dt ON dt.id = cp.ward_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
         WHERE f.followable_type = 'company' AND f.followable_id = v_target.id;
        IF v_is_owner THEN v_is_following := FALSE;
        ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
             AND f.followable_type = 'company' AND f.followable_id = v_target.id) INTO v_is_following;
        END IF;
        RETURN jsonb_build_object('kind', 'company', 'isOwner', v_is_owner, 'relation', v_relation,
            'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
            'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE));
    END IF;

    SELECT to_jsonb(mp) INTO v_profile FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
      FROM public.member_profiles mp JOIN public.wards dt ON dt.id = mp.ward_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
     WHERE f.followable_type = 'user' AND f.followable_id = v_target.id;
    IF v_is_owner THEN v_is_following := FALSE;
    ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
         AND f.followable_type = 'user' AND f.followable_id = v_target.id) INTO v_is_following;
    END IF;
    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := v_is_admin OR v_is_owner OR v_visibility = 'public'
        OR (v_visibility = 'connections' AND v_is_connected);
    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences FROM public.member_experiences e WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations FROM public.member_educations ed WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
          INTO v_skills FROM public.member_skills ms
         WHERE ms.user_id = v_target.id;
    ELSE v_experiences := '[]'::jsonb; v_educations := '[]'::jsonb; v_skills := '[]'::jsonb;
         v_profile := jsonb_build_object(
            'id', v_profile -> 'id',
            'user_id', v_target.id,
            'full_name', '',
            'avatar_url', NULL,
            'cover_url', NULL,
            'headline', NULL,
            'about', NULL,
            'province_id', NULL,
            'ward_id', NULL,
            'website', NULL,
            'open_to_work', FALSE,
            'profile_visibility', v_visibility,
            'created_at', v_profile -> 'created_at',
            'updated_at', v_profile -> 'updated_at',
            'deleted_at', NULL
         );
         v_province := NULL;
         v_ward := NULL;
    END IF;
    RETURN jsonb_build_object('kind', 'member', 'isOwner', v_is_owner, 'relation', v_relation,
        'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
        'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
        'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE),
        'isVisible', v_is_visible, 'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb), 'skills', COALESCE(v_skills, '[]'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_posts(
    p_target_user_id BIGINT, p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 10
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_is_owner BOOLEAN := FALSE; v_is_connected BOOLEAN := FALSE;
    v_is_admin BOOLEAN := FALSE; v_can_view BOOLEAN := TRUE;
    v_target_role VARCHAR(20); v_visibility VARCHAR(20); v_posts JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT u.role INTO v_target_role FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    v_is_owner := (v_me IS NOT NULL AND v_me = p_target_user_id);
    v_is_admin := public.is_admin();
    IF v_target_role = 'member' THEN
        SELECT mp.profile_visibility INTO v_visibility FROM public.member_profiles mp
         WHERE mp.user_id = p_target_user_id AND mp.deleted_at IS NULL LIMIT 1;
        IF v_visibility = 'private' AND NOT (v_is_owner OR v_is_admin) THEN
            v_can_view := FALSE;
        ELSIF v_visibility = 'connections' AND NOT (v_is_owner OR v_is_admin) THEN
            IF v_me IS NULL THEN
                v_can_view := FALSE;
            ELSE
                SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
                    AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
                      OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
                IF NOT v_is_connected THEN v_can_view := FALSE; END IF;
            END IF;
        END IF;
    END IF;
    IF NOT v_can_view THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    IF v_me IS NOT NULL AND NOT v_is_owner THEN
        SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
            AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
              OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
    END IF;
    WITH feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at, p.reaction_count, p.comment_count, p.share_count
          FROM public.posts p
         WHERE p.author_id = p_target_user_id AND p.deleted_at IS NULL AND p.status = 'active'
           AND (v_is_admin OR v_is_owner OR p.visibility = 'public'
             OR (p.visibility = 'connections' AND v_is_connected))
           AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
         ORDER BY p.created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb) INTO v_posts
      FROM (SELECT row_number() OVER (ORDER BY f.created_at DESC) AS ord,
                   f.id, f.author_id AS "authorId", f.content, f.post_type AS "postType",
                   f.media, f.visibility, f.created_at AS "createdAt",
                   jsonb_build_object('userId', f.author_id, 'role', au.role,
                       'displayName', COALESCE(amp.full_name, acp.name),
                       'avatarUrl', COALESCE(amp.avatar_url, acp.logo_url),
                       'headline', COALESCE(amp.headline, acp.industry)) AS author,
                   f.reaction_count AS "reactionCount", f.comment_count AS "commentCount",
                   f.share_count AS "shareCount",
                   CASE WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS(SELECT 1 FROM public.post_reactions r WHERE r.post_id = f.id AND r.user_id = v_me)
                   END AS "viewerReacted",
                   CASE WHEN f.post_type = 'poll' THEN (
                       SELECT COALESCE(jsonb_agg(jsonb_build_object('id', po.id, 'optionText', po.option_text,
                           'voteCount', po.vote_count, 'viewerVoted', CASE WHEN v_me IS NULL THEN FALSE
                               ELSE EXISTS(SELECT 1 FROM public.poll_votes pv WHERE pv.option_id = po.id AND pv.user_id = v_me)
                           END) ORDER BY po.id), '[]'::jsonb)
                       FROM public.poll_options po WHERE po.post_id = f.id)
                   ELSE NULL END AS "pollOptions"
              FROM feed f
              JOIN public.users au ON au.id = f.author_id
              LEFT JOIN public.member_profiles amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
              LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
        ) x;
    RETURN jsonb_build_object('posts', v_posts, 'next_cursor',
        (SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
          WHERE jsonb_array_length(v_posts) = p_posts_limit), 'can_view', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_posts(BIGINT, TIMESTAMPTZ, INT) TO anon, authenticated;
