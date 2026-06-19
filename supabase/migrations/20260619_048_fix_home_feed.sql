-- =============================================================================
-- FIX HOME FEED: 
-- 1. Fix next_cursor selecting oldest post due to LIMIT evaluation order.
-- 2. Use SECURITY DEFINER and explicit visibility checks to bypass any RLS issues.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_home_feed(p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 20, p_suggestion_limit INT DEFAULT 12) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_me BIGINT; v_stats JSONB; v_posts JSONB; v_jobs JSONB; v_suggestions JSONB; v_suggested_jobs JSONB; v_connection_ids BIGINT[];
    v_next_cursor TIMESTAMPTZ;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0), 'suggestions', '[]'::jsonb, 'suggested_jobs', '[]'::jsonb, 'posts', '[]'::jsonb, 'jobs', '[]'::jsonb, 'connection_ids', '[]'::jsonb, 'me', NULL, 'next_cursor', NULL);
    END IF;

    SELECT jsonb_build_object('connection_count', u.connection_count, 'profile_view_count', u.profile_view_count) INTO v_stats FROM public.users u WHERE u.id = v_me;
    SELECT COALESCE(array_agg(to_user_id), '{}') INTO v_connection_ids FROM public.user_connections_view WHERE from_user_id = v_me AND status = 'accepted';

    -- Suggestions
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.network_suggestions c JOIN public.users u ON u.id = c.suggested_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    -- Suggested Jobs
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggested_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId", COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl", cp.verification_status = 'verified' AS "companyVerified", pv.name AS "provinceName", w.name AS "wardName", jt.name AS "jobTypeName", wm.name AS "workModeName", j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_visible AS "salaryVisible", j.created_at AS "createdAt", false AS "viewerSaved", false AS "viewerApplied"
            FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
            LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards w ON w.id = j.ward_id LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
            WHERE j.status = 'active' AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW()) ORDER BY j.created_at DESC LIMIT 5) s;

    -- Posts (Push Model O(1))
    WITH feed_ids AS (
        SELECT post_id, created_at FROM public.user_feeds WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor) ORDER BY created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_posts
      FROM (SELECT p.id, p.author_id AS "authorId", p.content, p.post_type AS "postType", p.media, p.visibility, p.created_at AS "createdAt",
                 jsonb_build_object('userId', p.author_id, 'role', u.role, 'displayName', COALESCE(mp.full_name, cp.name), 'avatarUrl', COALESCE(mp.avatar_url, cp.logo_url), 'headline', COALESCE(mp.headline, cp.industry)) AS author,
                 p.reaction_count AS "reactionCount", p.comment_count AS "commentCount", p.share_count AS "shareCount",
                 EXISTS(SELECT 1 FROM public.post_reactions pr WHERE pr.post_id = p.id AND pr.user_id = v_me) AS "viewerReacted"
            FROM feed_ids f JOIN public.posts p ON p.id = f.post_id JOIN public.users u ON u.id = p.author_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = p.author_id LEFT JOIN public.company_profiles cp ON cp.user_id = p.author_id
            WHERE p.status = 'active' AND p.deleted_at IS NULL
              AND (p.visibility = 'public' OR p.author_id = v_me OR (p.visibility = 'connections' AND public.is_connected_with(p.author_id)))
            ORDER BY f.created_at DESC) s;

    -- Jobs Stream
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId", COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl", cp.verification_status = 'verified' AS "companyVerified", pv.name AS "provinceName", w.name AS "wardName", jt.name AS "jobTypeName", wm.name AS "workModeName", j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_visible AS "salaryVisible", j.created_at AS "createdAt", false AS "viewerSaved", false AS "viewerApplied"
            FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
            LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards w ON w.id = j.ward_id LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
            WHERE j.status = 'active' AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW()) AND (p_posts_cursor IS NULL OR j.created_at < p_posts_cursor) ORDER BY j.created_at DESC LIMIT p_posts_limit) s;

    -- Correct next_cursor calculation
    SELECT MIN(created_at) INTO v_next_cursor FROM (
        SELECT created_at FROM public.user_feeds 
        WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor) 
        ORDER BY created_at DESC LIMIT p_posts_limit
    ) sub;

    RETURN jsonb_build_object(
        'stats', v_stats, 'suggestions', v_suggestions, 'suggested_jobs', v_suggested_jobs, 'posts', v_posts, 'jobs', v_jobs, 'connection_ids', to_jsonb(v_connection_ids), 'me', v_me, 'next_cursor', v_next_cursor
    );
END;
$$;
