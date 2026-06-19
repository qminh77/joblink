-- =================================================================================
-- MIGRATION: Kiến trúc O(1) cho Joblink (Denormalization & Push Model Feed)
-- Đồng bộ chính xác với Type của Next.js Frontend
-- =================================================================================

-- 1. POSTS DENORMALIZATION (Counter Caches)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reaction_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_counts ON public.posts(reaction_count DESC, comment_count DESC);

-- Trigger Reactions
CREATE OR REPLACE FUNCTION public.post_reaction_counter_trigger() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_reaction_counter ON public.post_reactions;
CREATE TRIGGER trg_post_reaction_counter AFTER INSERT OR DELETE ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.post_reaction_counter_trigger();

-- Trigger Comments
CREATE OR REPLACE FUNCTION public.post_comment_counter_trigger() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
        UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_comment_counter ON public.post_comments;
CREATE TRIGGER trg_post_comment_counter AFTER INSERT OR UPDATE OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.post_comment_counter_trigger();

-- Trigger Shares
CREATE OR REPLACE FUNCTION public.post_share_counter_trigger() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_post_share_counter ON public.post_shares;
CREATE TRIGGER trg_post_share_counter AFTER INSERT OR DELETE ON public.post_shares FOR EACH ROW EXECUTE FUNCTION public.post_share_counter_trigger();


-- 2. MESSAGING DENORMALIZATION (Inbox O(1))
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_id BIGINT REFERENCES public.messages(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_content TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_sender_id BIGINT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_created_at TIMESTAMPTZ;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION public.joblink_after_message_insert() RETURNS trigger AS $$
BEGIN
    UPDATE public.conversations
       SET updated_at = NEW.created_at, last_message_id = NEW.id, last_content = NEW.content, last_sender_id = NEW.sender_id, last_message_created_at = NEW.created_at
     WHERE id = NEW.conversation_id;

    UPDATE public.conversation_participants
       SET unread_count = unread_count + 1
     WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_unread_count_trigger() RETURNS trigger AS $$
BEGIN
    IF NEW.last_read_at IS NOT NULL AND (OLD.last_read_at IS NULL OR NEW.last_read_at > OLD.last_read_at) THEN
        NEW.unread_count = 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_reset_unread_count ON public.conversation_participants;
CREATE TRIGGER trg_reset_unread_count BEFORE UPDATE ON public.conversation_participants FOR EACH ROW EXECUTE FUNCTION public.reset_unread_count_trigger();


-- 3. CONNECTIONS: GIẢI QUYẾT OR BẰNG VIEW
CREATE OR REPLACE VIEW public.user_connections_view AS
SELECT requester_id AS from_user_id, receiver_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections
UNION ALL
SELECT receiver_id AS from_user_id, requester_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections;

-- Precomputed Suggestions
CREATE TABLE IF NOT EXISTS public.network_suggestions (
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    suggested_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, suggested_user_id)
);

-- Hàm sinh suggestions ngẫu nhiên nhanh (thay thế ORDER BY RANDOM quét toàn bảng)
CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT) RETURNS void AS $$
BEGIN
    DELETE FROM public.network_suggestions WHERE user_id = p_user_id;
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT p_user_id, u.id, 1
      FROM public.users u
     WHERE u.deleted_at IS NULL AND u.status = 'active' AND u.role <> 'admin' AND u.id <> p_user_id
       AND u.id NOT IN (SELECT to_user_id FROM public.user_connections_view WHERE from_user_id = p_user_id)
     ORDER BY u.id DESC LIMIT p_limit * 5; -- Lấy 1 tập nhỏ mới nhất để random in-memory ở RPC
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. HOME FEED: PUSH MODEL (Fan-out)
CREATE TABLE IF NOT EXISTS public.user_feeds (
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_user_feeds_user_created ON public.user_feeds(user_id, created_at DESC);

GRANT SELECT ON public.user_feeds TO authenticated;
GRANT SELECT ON public.user_connections_view TO authenticated;

CREATE OR REPLACE FUNCTION public.fanout_post_to_feed() RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
        INSERT INTO public.user_feeds (user_id, post_id, created_at) VALUES (NEW.author_id, NEW.id, NEW.created_at) ON CONFLICT DO NOTHING;
        IF NEW.visibility IN ('public', 'connections') THEN
            INSERT INTO public.user_feeds (user_id, post_id, created_at)
            SELECT to_user_id, NEW.id, NEW.created_at FROM public.user_connections_view WHERE from_user_id = NEW.author_id AND status = 'accepted' ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fanout_post ON public.posts;
CREATE TRIGGER trg_fanout_post AFTER INSERT OR UPDATE OF status, visibility, deleted_at ON public.posts FOR EACH ROW EXECUTE FUNCTION public.fanout_post_to_feed();


-- 5. REWRITE CÁC RPC ĐỂ ĐẢM BẢO ĐÚNG ARCHITECTURE VÀ TYPE CỦA NEXT.JS

-- 5A. get_messaging_overview
CREATE OR REPLACE FUNCTION public.get_messaging_overview(p_limit INT DEFAULT 50) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER STABLE AS $$
DECLARE
    v_me BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0); END IF;

    RETURN (
        WITH my_convo AS (SELECT cp.conversation_id, cp.unread_count FROM public.conversation_participants cp WHERE cp.user_id = v_me),
        overview AS (
            SELECT c.id AS "conversationId", c.updated_at AS "updatedAt", c.last_message_id AS "lastMessageId", c.last_sender_id AS "lastSenderId", c.last_content AS "lastContent", c.last_message_created_at AS "lastCreatedAt", mc.unread_count AS "unreadCount", op.user_id AS "otherUserId", COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline", u.role AS "role"
            FROM my_convo mc
            JOIN public.conversations c ON c.id = mc.conversation_id
            JOIN public.conversation_participants op ON op.conversation_id = c.id AND op.user_id <> v_me
            JOIN public.users u ON u.id = op.user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = op.user_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = op.user_id AND cp.deleted_at IS NULL
            ORDER BY c.updated_at DESC LIMIT p_limit
        )
        SELECT jsonb_build_object('items', COALESCE(jsonb_agg(row_to_jsonb(o)), '[]'::jsonb), 'unreadConversations', (SELECT COUNT(*) FROM my_convo WHERE unread_count > 0)) FROM overview o
    );
END;
$$;


-- 5B. get_network_overview
CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_me BIGINT;
    v_suggestions JSONB; v_connections JSONB; v_incoming JSONB; v_outgoing JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('suggestions', '[]'::jsonb, 'connections', '[]'::jsonb, 'incoming', '[]'::jsonb, 'outgoing', '[]'::jsonb); END IF;

    -- Ensure precomputed suggestions exist
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.network_suggestions c
            JOIN public.users u ON u.id = c.suggested_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_connections
      FROM (SELECT ac.to_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.user_connections_view ac JOIN public.users u ON u.id = ac.to_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = ac.to_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = ac.to_user_id
            WHERE ac.from_user_id = v_me AND ac.status = 'accepted' LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_incoming
      FROM (SELECT c.requester_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.connections c JOIN public.users u ON u.id = c.requester_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.receiver_id = v_me AND c.status = 'pending' ORDER BY c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_outgoing
      FROM (SELECT c.receiver_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.connections c JOIN public.users u ON u.id = c.receiver_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.requester_id = v_me AND c.status = 'pending' ORDER BY c.requested_at DESC LIMIT 50) s;

    RETURN jsonb_build_object('suggestions', v_suggestions, 'connections', v_connections, 'incoming', v_incoming, 'outgoing', v_outgoing);
END;
$$;


-- 5C. get_home_feed (Full Next.js Type Match)
CREATE OR REPLACE FUNCTION public.get_home_feed(p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 20, p_suggestion_limit INT DEFAULT 12) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_me BIGINT; v_stats JSONB; v_posts JSONB; v_jobs JSONB; v_suggestions JSONB; v_suggested_jobs JSONB; v_connection_ids BIGINT[];
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
            ORDER BY f.created_at DESC) s;

    -- Jobs Stream
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId", COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl", cp.verification_status = 'verified' AS "companyVerified", pv.name AS "provinceName", w.name AS "wardName", jt.name AS "jobTypeName", wm.name AS "workModeName", j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_visible AS "salaryVisible", j.created_at AS "createdAt", false AS "viewerSaved", false AS "viewerApplied"
            FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
            LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards w ON w.id = j.ward_id LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
            WHERE j.status = 'active' AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW()) AND (p_posts_cursor IS NULL OR j.created_at < p_posts_cursor) ORDER BY j.created_at DESC LIMIT p_posts_limit) s;

    RETURN jsonb_build_object(
        'stats', v_stats, 'suggestions', v_suggestions, 'suggested_jobs', v_suggested_jobs, 'posts', v_posts, 'jobs', v_jobs, 'connection_ids', to_jsonb(v_connection_ids), 'me', v_me, 'next_cursor', (SELECT MIN(created_at) FROM public.user_feeds WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor) LIMIT p_posts_limit)
    );
END;
$$;


-- 5D. get_user_posts (Full Next.js Type Match & O(1))
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
               p.visibility, p.created_at, p.reaction_count, p.comment_count, p.share_count
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
              f.reaction_count AS "reactionCount",
              f.comment_count AS "commentCount",
              f.share_count AS "shareCount",
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
                      'voteCount', po.vote_count,
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
