-- =============================================================================
-- JOBLINK MIGRATION 20260521_008 — USER POSTS RPC
-- =============================================================================
-- Cung cấp endpoint get_user_posts(target_user, cursor, limit) trả về:
--   • posts: trang bài viết của một user (cursor pagination theo created_at DESC)
--   • next_cursor: trỏ tới trang kế tiếp (NULL nếu hết)
--   • can_view: viewer có quyền xem post của target hay không
--
-- Visibility rules áp dụng cho từng post:
--   • 'public'      — ai cũng xem được
--   • 'connections' — chỉ author + connections của author
--   • 'private'     — chỉ author
-- Ngoài ra, nếu target là member và profile_visibility = 'private' thì viewer
-- (không phải owner) sẽ không thấy post nào.
--
-- SECURITY INVOKER — giữ nguyên RLS, function chạy với quyền của caller.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_posts(
    p_target_user_id BIGINT,
    p_posts_cursor   TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit    INT         DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me           BIGINT;
    v_is_owner     BOOLEAN := FALSE;
    v_is_connected BOOLEAN := FALSE;
    v_can_view     BOOLEAN := TRUE;
    v_target_role  VARCHAR(20);
    v_visibility   VARCHAR(20);
    v_posts        JSONB;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    -- Xác định role của target và visibility profile (nếu là member)
    SELECT u.role INTO v_target_role
      FROM public.users u
     WHERE u.id = p_target_user_id
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object(
            'posts', '[]'::jsonb,
            'next_cursor', NULL,
            'can_view', FALSE
        );
    END IF;

    v_is_owner := (v_me IS NOT NULL AND v_me = p_target_user_id);

    IF v_target_role = 'member' THEN
        SELECT mp.profile_visibility INTO v_visibility
          FROM public.member_profiles mp
         WHERE mp.user_id = p_target_user_id
           AND mp.deleted_at IS NULL
         LIMIT 1;

        IF v_visibility = 'private' AND NOT v_is_owner THEN
            v_can_view := FALSE;
        END IF;
    END IF;

    IF NOT v_can_view THEN
        RETURN jsonb_build_object(
            'posts', '[]'::jsonb,
            'next_cursor', NULL,
            'can_view', FALSE
        );
    END IF;

    -- Viewer có là connection của target không (để show post visibility='connections')
    IF v_me IS NOT NULL AND NOT v_is_owner THEN
        SELECT EXISTS (
            SELECT 1
              FROM public.connections c
             WHERE c.status = 'accepted'
               AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
                 OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))
        ) INTO v_is_connected;
    END IF;

    WITH feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at
          FROM public.posts p
         WHERE p.author_id = p_target_user_id
           AND p.deleted_at IS NULL
           AND p.status = 'active'
           AND (
               v_is_owner
               OR p.visibility = 'public'
               OR (p.visibility = 'connections' AND v_is_connected)
           )
           AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
         ORDER BY p.created_at DESC
         LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb)
      INTO v_posts
      FROM (
          SELECT
              row_number() OVER (ORDER BY f.created_at DESC) AS ord,
              f.id,
              f.author_id   AS "authorId",
              f.content,
              f.post_type   AS "postType",
              f.media,
              f.visibility,
              f.created_at  AS "createdAt",
              jsonb_build_object(
                  'userId',      f.author_id,
                  'role',        au.role,
                  'displayName', COALESCE(amp.full_name, acp.name),
                  'avatarUrl',   COALESCE(amp.avatar_url, acp.logo_url),
                  'headline',    COALESCE(amp.headline, acp.industry)
              ) AS author,
              (SELECT COUNT(*) FROM public.post_reactions r WHERE r.post_id = f.id) AS "reactionCount",
              (SELECT COUNT(*) FROM public.post_comments cm
                WHERE cm.post_id = f.id AND cm.deleted_at IS NULL AND cm.status = 'active') AS "commentCount",
              (SELECT COUNT(*) FROM public.post_shares sh WHERE sh.post_id = f.id) AS "shareCount",
              CASE
                WHEN v_me IS NULL THEN FALSE
                ELSE EXISTS (
                    SELECT 1 FROM public.post_reactions r
                     WHERE r.post_id = f.id AND r.user_id = v_me
                )
              END AS "viewerReacted"
            FROM feed f
            JOIN public.users au ON au.id = f.author_id
            LEFT JOIN public.member_profiles  amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
            LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
      ) x;

    RETURN jsonb_build_object(
        'posts', v_posts,
        'next_cursor', (
            SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
            WHERE jsonb_array_length(v_posts) = p_posts_limit
        ),
        'can_view', TRUE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_posts(BIGINT, TIMESTAMPTZ, INT)
    TO anon, authenticated;
