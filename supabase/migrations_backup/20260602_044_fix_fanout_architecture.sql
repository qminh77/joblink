-- =============================================================================
-- FIX: Đảm bảo Push Model (Fan-out) cho Home Feed hoạt động
-- Migration này chạy an toàn (idempotent) dù migration 042 đã chạy hay chưa.
-- =============================================================================

-- 1. Đảm bảo cột share_count tồn tại (get_home_feed selects nó)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reaction_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

-- 2. user_connections_view (dùng bởi fanout + get_home_feed)
CREATE OR REPLACE VIEW public.user_connections_view AS
SELECT requester_id AS from_user_id, receiver_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections
UNION ALL
SELECT receiver_id AS from_user_id, requester_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections;

-- 3. user_feeds table (Push Model)
CREATE TABLE IF NOT EXISTS public.user_feeds (
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_user_feeds_user_created ON public.user_feeds(user_id, created_at DESC);

-- 3b. QUAN TRỌNG: Grant quyền SELECT cho authenticated role
-- (get_home_feed dùng SECURITY INVOKER nên cần được uỷ quyền)
GRANT SELECT ON public.user_feeds TO authenticated;
GRANT SELECT ON public.user_connections_view TO authenticated;

-- 4. Fan-out trigger function & trigger
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

-- 5. Counter cache triggers (nếu chưa có)
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

-- 6. BACKFILL: nạp user_feeds cho posts cũ
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id, author_id, created_at, visibility FROM public.posts WHERE status = 'active' AND deleted_at IS NULL)
    LOOP
        INSERT INTO public.user_feeds (user_id, post_id, created_at)
        VALUES (r.author_id, r.id, r.created_at)
        ON CONFLICT DO NOTHING;

        IF r.visibility IN ('public', 'connections') THEN
            INSERT INTO public.user_feeds (user_id, post_id, created_at)
            SELECT to_user_id, r.id, r.created_at
              FROM public.user_connections_view
             WHERE from_user_id = r.author_id AND status = 'accepted'
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END
$$;

-- 7. BACKFILL: đồng bộ counter cache cho posts cũ
UPDATE public.posts p
   SET reaction_count = (SELECT COUNT(*)::INT FROM public.post_reactions r WHERE r.post_id = p.id),
       comment_count = (SELECT COUNT(*)::INT FROM public.post_comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL AND c.status = 'active'),
       share_count = (SELECT COUNT(*)::INT FROM public.post_shares s WHERE s.post_id = p.id);
