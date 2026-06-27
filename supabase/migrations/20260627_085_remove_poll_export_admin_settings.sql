-- Remove retired features:
-- - Poll posts / poll voting
-- - User CSV export permission
-- - Admin-facing system settings wording/entry point

BEGIN;

DELETE FROM public.notifications
WHERE type = 'poll_vote';

DELETE FROM public.notification_preferences
WHERE type = 'poll_vote';

DELETE FROM public.role_permissions rp
USING public.permissions p
WHERE rp.permission_id = p.id
  AND p.name IN ('users.export', 'posts.vote');

DELETE FROM public.permissions
WHERE name IN ('users.export', 'posts.vote');

DELETE FROM public.actions a
WHERE a.name IN ('export', 'vote')
  AND NOT EXISTS (
    SELECT 1 FROM public.permissions p WHERE p.action_id = a.id
  );

UPDATE public.modules
SET label = 'Cài đặt cá nhân'
WHERE name = 'settings';

UPDATE public.permissions p
SET label = m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE p.module_id = m.id
  AND p.action_id = a.id
  AND m.name = 'settings';

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS chk_post_type;

UPDATE public.posts
SET post_type = 'text',
    media = NULL
WHERE post_type = 'poll';

ALTER TABLE public.posts
  ADD CONSTRAINT chk_post_type CHECK (post_type IN ('text','image','video','article'));

CREATE OR REPLACE FUNCTION public.create_post(
    p_content TEXT,
    p_post_type TEXT DEFAULT 'text',
    p_media JSONB DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_content TEXT := btrim(COALESCE(p_content, ''));
    v_row public.posts%ROWTYPE;
BEGIN
    v_me := public.auth_user_id();
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF NOT public.is_active_user() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'accountInactive');
    END IF;

    IF p_post_type NOT IN ('text','image','video','article') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidPostType');
    END IF;

    IF p_visibility NOT IN ('public','connections','private') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidVisibility');
    END IF;

    IF v_content = '' AND p_media IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent');
    END IF;

    INSERT INTO public.posts(author_id, content, post_type, media, visibility)
    VALUES (v_me, v_content, p_post_type, p_media, p_visibility)
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'post', jsonb_build_object(
            'id', v_row.id,
            'author_id', v_row.author_id,
            'content', v_row.content,
            'post_type', v_row.post_type,
            'media', v_row.media,
            'visibility', v_row.visibility,
            'created_at', v_row.created_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_post(TEXT, TEXT, JSONB, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_home_feed(
    p_posts_cursor TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit INT DEFAULT 20,
    p_suggestion_limit INT DEFAULT 12
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_me BIGINT; v_stats JSONB; v_posts JSONB; v_jobs JSONB;
    v_suggestions JSONB; v_suggested_jobs JSONB; v_connection_ids BIGINT[];
    v_next_cursor TIMESTAMPTZ;
    v_post_ids BIGINT[]; v_job_ids BIGINT[];
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0),
            'suggestions', '[]'::jsonb, 'suggested_jobs', '[]'::jsonb, 'posts', '[]'::jsonb,
            'jobs', '[]'::jsonb, 'connection_ids', '[]'::jsonb, 'me', NULL, 'next_cursor', NULL);
    END IF;
    SELECT jsonb_build_object('connection_count', u.connection_count, 'profile_view_count', u.profile_view_count)
      INTO v_stats FROM public.users u WHERE u.id = v_me;
    SELECT COALESCE(array_agg(to_user_id), '{}') INTO v_connection_ids
      FROM public.user_connections_view WHERE from_user_id = v_me AND status = 'accepted';

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (
        SELECT u.id AS "userId", u.role AS role,
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline"
          FROM public.users u
          LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
          LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
         WHERE u.deleted_at IS NULL
           AND u.status = 'active'
           AND u.role <> 'admin'
           AND u.id <> v_me
           AND NOT EXISTS (
             SELECT 1 FROM public.connections c
              WHERE (c.requester_id = v_me AND c.receiver_id = u.id)
                 OR (c.requester_id = u.id AND c.receiver_id = v_me)
           )
           AND NOT EXISTS (
             SELECT 1 FROM public.user_blocks b
              WHERE (b.blocker_id = v_me AND b.blocked_id = u.id)
                 OR (b.blocker_id = u.id AND b.blocked_id = v_me)
           )
           AND (
             (u.role = 'member' AND mp.deleted_at IS NULL AND mp.profile_visibility = 'public')
             OR
             (u.role = 'company' AND cp.deleted_at IS NULL AND cp.verification_status = 'verified')
           )
         ORDER BY RANDOM() LIMIT p_suggestion_limit
      ) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggested_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId",
                   COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl",
                   cp.verification_status = 'verified' AS "companyVerified",
                   pv.name AS "provinceName", w.name AS "wardName",
                   jt.name AS "jobTypeName", wm.name AS "workModeName",
                   j.salary_min AS "salaryMin", j.salary_max AS "salaryMax",
                   j.salary_visible AS "salaryVisible", j.created_at AS "createdAt",
                   FALSE AS "viewerSaved", FALSE AS "viewerApplied"
              FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
              LEFT JOIN public.provinces pv ON pv.id = j.province_id
              LEFT JOIN public.wards w ON w.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
              LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             WHERE j.status = 'active' AND j.deleted_at IS NULL
               AND (j.expires_at IS NULL OR j.expires_at > NOW())
             ORDER BY j.created_at DESC LIMIT 5) s;

    WITH combined_stream AS (
        SELECT post_id AS id, 'post' AS kind, created_at
          FROM public.user_feeds
         WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor)
        UNION ALL
        SELECT id, 'job' AS kind, created_at
          FROM public.jobs
         WHERE status = 'active' AND deleted_at IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor)
    ),
    paginated_stream AS (
        SELECT id, kind, created_at FROM combined_stream
         ORDER BY created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(array_agg(id) FILTER (WHERE kind = 'post'), '{}'),
           COALESCE(array_agg(id) FILTER (WHERE kind = 'job'), '{}'),
           MIN(created_at)
      INTO v_post_ids, v_job_ids, v_next_cursor FROM paginated_stream;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_posts
      FROM (SELECT p.id, p.author_id AS "authorId", p.content, p.post_type AS "postType",
                   p.media, p.visibility, p.created_at AS "createdAt",
                   jsonb_build_object('userId', p.author_id, 'role', u.role,
                       'displayName', COALESCE(mp.full_name, cp.name),
                       'avatarUrl', COALESCE(mp.avatar_url, cp.logo_url),
                       'headline', COALESCE(mp.headline, cp.industry)) AS author,
                   p.reaction_count AS "reactionCount", p.comment_count AS "commentCount",
                   p.share_count AS "shareCount",
                   EXISTS(SELECT 1 FROM public.post_reactions pr
                           WHERE pr.post_id = p.id AND pr.user_id = v_me) AS "viewerReacted"
              FROM unnest(v_post_ids) f(id) JOIN public.posts p ON p.id = f.id
              JOIN public.users u ON u.id = p.author_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = p.author_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = p.author_id
             WHERE p.status = 'active' AND p.deleted_at IS NULL
               AND (p.visibility = 'public' OR p.author_id = v_me
                 OR (p.visibility = 'connections' AND public.is_connected_with(p.author_id)))
             ORDER BY p.created_at DESC) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId",
                   COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl",
                   cp.verification_status = 'verified' AS "companyVerified",
                   pv.name AS "provinceName", w.name AS "wardName",
                   jt.name AS "jobTypeName", wm.name AS "workModeName",
                   j.salary_min AS "salaryMin", j.salary_max AS "salaryMax",
                   j.salary_visible AS "salaryVisible", j.created_at AS "createdAt",
                   EXISTS(SELECT 1 FROM public.saved_jobs sj
                           WHERE sj.job_id = j.id AND sj.user_id = v_me) AS "viewerSaved",
                   EXISTS(SELECT 1 FROM public.job_applications ja
                           WHERE ja.job_id = j.id AND ja.applicant_id = v_me
                             AND ja.status <> 'withdrawn') AS "viewerApplied"
              FROM unnest(v_job_ids) f(id) JOIN public.jobs j ON j.id = f.id
              JOIN public.users u ON u.id = j.company_user_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
              LEFT JOIN public.provinces pv ON pv.id = j.province_id
              LEFT JOIN public.wards w ON w.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
              LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             ORDER BY j.created_at DESC) s;

    RETURN jsonb_build_object('stats', v_stats, 'suggestions', v_suggestions,
        'suggested_jobs', v_suggested_jobs, 'posts', v_posts, 'jobs', v_jobs,
        'connection_ids', to_jsonb(v_connection_ids), 'me', v_me, 'next_cursor', v_next_cursor);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT) TO authenticated;

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
                   END AS "viewerReacted"
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

DO $$
BEGIN
  IF to_regclass('public.poll_votes') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_poll_votes_counter ON public.poll_votes';
  END IF;

  IF to_regclass('public.poll_options') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'poll_options'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.poll_options';
  END IF;

  IF to_regclass('public.poll_votes') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'poll_votes'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.poll_votes';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

DROP FUNCTION IF EXISTS public.create_poll_post(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.increment_poll_vote_count(BIGINT);
DROP FUNCTION IF EXISTS public.poll_votes_counter_trigger();

DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;

NOTIFY pgrst, 'reload schema';

COMMIT;
