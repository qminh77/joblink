-- =============================================================================
-- JOBLINK MIGRATION 20260601_026 — POLL MEDIA UPDATE + VOTE PRIVACY
-- =============================================================================
-- 1. RPC update_poll_media — recalculates posts.media from poll_options table
--    (called by voteAction server action after each vote).
-- 2. Fix get_home_feed / get_user_posts — only reveal voteCount to voters
--    and post author; non-voters get voteCount = 0.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RPC: update_poll_media — atomic media rebuild after vote
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER allows updating posts.media regardless of RLS (the function
-- only writes a deterministic JSONB computed from poll_options data, so it is
-- safe). The voter never passes arbitrary values.
CREATE OR REPLACE FUNCTION public.update_poll_media(p_post_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_options JSONB;
    v_total_votes INT;
    v_media JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', po.id,
            'optionText', po.option_text,
            'voteCount', po.vote_count
        ) ORDER BY po.id
    ), '[]'::jsonb)
    INTO v_options
    FROM public.poll_options po
    WHERE po.post_id = p_post_id;

    SELECT COALESCE(SUM(po.vote_count), 0)
    INTO v_total_votes
    FROM public.poll_options po
    WHERE po.post_id = p_post_id;

    v_media := jsonb_build_object(
        'type', 'poll',
        'options', v_options,
        'totalVotes', v_total_votes
    );

    UPDATE public.posts
    SET media = v_media
    WHERE id = p_post_id
      AND deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_poll_media(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. get_home_feed — hide voteCount from non-voters
-- -----------------------------------------------------------------------------
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

    SELECT jsonb_build_object(
        'connection_count', u.connection_count,
        'profile_view_count', u.profile_view_count
    ) INTO v_stats
    FROM public.users u WHERE u.id = v_me;

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
            LEFT JOIN public.districts md  ON md.id  = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id  = cp.district_id
      ) s;

    WITH visible_authors AS (
        SELECT unnest(array_prepend(v_me, v_connection_ids)) AS author_id
    ),
    feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at,
               (p.author_id = v_me) AS author_is_viewer
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
              EXISTS (
                  SELECT 1 FROM public.post_reactions r
                   WHERE r.post_id = f.id AND r.user_id = v_me
              ) AS "viewerReacted",
              CASE
                WHEN f.post_type = 'poll' THEN (
                  SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                      'id', po.id,
                      'optionText', po.option_text,
                      'voteCount', CASE
                        WHEN v_me IS NULL THEN 0
                        WHEN f.author_is_viewer THEN po.vote_count
                        WHEN EXISTS (
                          SELECT 1 FROM public.poll_votes pv3
                           WHERE pv3.post_id = f.id AND pv3.user_id = v_me
                        ) THEN po.vote_count
                        ELSE 0
                      END,
                      'viewerVoted', CASE
                        WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS (
                          SELECT 1 FROM public.poll_votes pv
                           WHERE pv.option_id = po.id AND pv.user_id = v_me
                        )
                      END
                    ) ORDER BY po.id
                  ), '[]'::jsonb)
                  FROM public.poll_options po
                  WHERE po.post_id = f.id
                )
                ELSE NULL
              END AS "pollOptions"
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

GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT)
    TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. get_user_posts — hide voteCount from non-voters
-- -----------------------------------------------------------------------------
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
              END AS "viewerReacted",
              CASE
                WHEN f.post_type = 'poll' THEN (
                  SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                      'id', po.id,
                      'optionText', po.option_text,
                      'voteCount', CASE
                        WHEN v_me IS NULL THEN 0
                        WHEN v_is_owner THEN po.vote_count
                        WHEN EXISTS (
                          SELECT 1 FROM public.poll_votes pv3
                           WHERE pv3.post_id = f.id AND pv3.user_id = v_me
                        ) THEN po.vote_count
                        ELSE 0
                      END,
                      'viewerVoted', CASE
                        WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS (
                          SELECT 1 FROM public.poll_votes pv
                           WHERE pv.option_id = po.id AND pv.user_id = v_me
                        )
                      END
                    ) ORDER BY po.id
                  ), '[]'::jsonb)
                  FROM public.poll_options po
                  WHERE po.post_id = f.id
                )
                ELSE NULL
              END AS "pollOptions"
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

-- -----------------------------------------------------------------------------
-- 4. Trigger: tự động increment vote_count + rebuild media sau mỗi vote
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER để có thể UPDATE poll_options (increment) và posts (media)
-- bất kể RLS (chỉ ghi dữ liệu đã được xác thực qua UNIQUE constraint).
CREATE OR REPLACE FUNCTION public.trigger_after_poll_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.poll_options
       SET vote_count = vote_count + 1
     WHERE id = NEW.option_id;

    PERFORM public.update_poll_media(NEW.post_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_poll_vote_after_insert ON public.poll_votes;

CREATE TRIGGER trg_poll_vote_after_insert
    AFTER INSERT ON public.poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_after_poll_vote();

-- =============================================================================
-- END MIGRATION 20260601_026
-- =============================================================================
