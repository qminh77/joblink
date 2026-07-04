-- =============================================================================
-- JOBLINK MIGRATION 20260520_002 — HOME FEED RPC (LAYER 2)
-- =============================================================================
-- Cung cấp 1 endpoint duy nhất get_home_feed(...) trả về JSON gộp:
--   • stats: { profile_view_count, connection_count }
--   • suggestions: top N users không phải kết nối hiện tại
--   • posts: page đầu của feed (cursor pagination theo created_at DESC)
--
-- Mục đích: cắt 3-5 roundtrip từ home page → 1 roundtrip.
--
-- SECURITY INVOKER — giữ nguyên RLS, function chạy với quyền của caller.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_home_feed(
    p_posts_cursor TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit  INT         DEFAULT 20,
    p_suggestion_limit INT     DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me             BIGINT;
    v_stats          JSONB;
    v_suggestions    JSONB;
    v_posts          JSONB;
    v_excluded_ids   BIGINT[];
    v_connection_ids BIGINT[];
BEGIN
    -- Lấy app user id hiện tại từ auth context.
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object(
            'stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0),
            'suggestions', '[]'::jsonb,
            'posts', '[]'::jsonb,
            'connection_ids', '[]'::jsonb,
            'me', NULL,
            'next_cursor', NULL
        );
    END IF;

    -- ---------------------------------------------------------------------
    -- STATS — đọc trực tiếp counter cache (O(1))
    -- ---------------------------------------------------------------------
    SELECT jsonb_build_object(
        'connection_count', u.connection_count,
        'profile_view_count', u.profile_view_count
    ) INTO v_stats
    FROM public.users u WHERE u.id = v_me;

    -- ---------------------------------------------------------------------
    -- Tập user ID đã liên quan (để loại khỏi suggestions, và để filter posts)
    -- ---------------------------------------------------------------------
    SELECT COALESCE(array_agg(DISTINCT other_id), '{}')
      INTO v_excluded_ids
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id
                      ELSE c.requester_id END AS other_id
            FROM public.connections c
           WHERE c.requester_id = v_me OR c.receiver_id = v_me
      ) sub;

    SELECT COALESCE(array_agg(DISTINCT other_id), '{}')
      INTO v_connection_ids
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id
                      ELSE c.requester_id END AS other_id
            FROM public.connections c
           WHERE c.status = 'accepted'
             AND (c.requester_id = v_me OR c.receiver_id = v_me)
      ) sub;

    -- ---------------------------------------------------------------------
    -- SUGGESTIONS — pick recent active users không thuộc excluded
    -- LEFT JOIN profile để build display name/avatar/headline/location 1 phát.
    -- ---------------------------------------------------------------------
    WITH candidates AS (
        SELECT u.id, u.role
          FROM public.users u
         WHERE u.deleted_at IS NULL
           AND u.status = 'active'
           AND u.role <> 'admin'
           AND u.id <> v_me
           AND NOT (u.id = ANY(v_excluded_ids))
         ORDER BY u.created_at DESC
         LIMIT p_suggestion_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_suggestions
      FROM (
          SELECT
              row_number() OVER () AS ord,
              c.id   AS "userId",
              c.role,
              COALESCE(mp.full_name, cp.name)   AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry)   AS headline,
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS location
            FROM candidates c
            LEFT JOIN public.member_profiles  mp ON mp.user_id = c.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = c.id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id  = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id  = cp.ward_id
      ) s;

    -- ---------------------------------------------------------------------
    -- POSTS — của tôi + của connections; visibility = 'public' hoặc 'connections'
    -- cursor pagination theo created_at DESC.
    -- ---------------------------------------------------------------------
    WITH visible_authors AS (
        SELECT unnest(array_prepend(v_me, v_connection_ids)) AS author_id
    ),
    feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at
          FROM public.posts p
          JOIN visible_authors va ON va.author_id = p.author_id
         WHERE p.deleted_at IS NULL
           AND p.status = 'active'
           AND (p.visibility = 'public'
                OR (p.visibility = 'connections' AND p.author_id = ANY(v_connection_ids))
                OR p.author_id = v_me)
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
              -- Author display block
              jsonb_build_object(
                  'userId',      f.author_id,
                  'role',        au.role,
                  'displayName', COALESCE(amp.full_name, acp.name),
                  'avatarUrl',   COALESCE(amp.avatar_url, acp.logo_url),
                  'headline',    COALESCE(amp.headline, acp.industry)
              ) AS author,
              -- Engagement counts
              (SELECT COUNT(*) FROM public.post_reactions r WHERE r.post_id = f.id) AS "reactionCount",
              (SELECT COUNT(*) FROM public.post_comments  cm
                WHERE cm.post_id = f.id AND cm.deleted_at IS NULL AND cm.status = 'active') AS "commentCount",
              (SELECT COUNT(*) FROM public.post_shares    sh WHERE sh.post_id = f.id) AS "shareCount",
              -- Đã react chưa
              EXISTS (
                  SELECT 1 FROM public.post_reactions r
                   WHERE r.post_id = f.id AND r.user_id = v_me
              ) AS "viewerReacted"
            FROM feed f
            JOIN public.users au ON au.id = f.author_id
            LEFT JOIN public.member_profiles  amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
            LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
      ) x;

    RETURN jsonb_build_object(
        'stats',          v_stats,
        'suggestions',    v_suggestions,
        'posts',          v_posts,
        'connection_ids', to_jsonb(v_connection_ids),
        'me',             v_me,
        'next_cursor', (
            SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
            WHERE jsonb_array_length(v_posts) = p_posts_limit
        )
    );
END;
$$;

-- Cho phép gọi từ authenticated role của Supabase.
GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT)
    TO authenticated;

-- =============================================================================
-- END MIGRATION 20260520_002
-- =============================================================================
