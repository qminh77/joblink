-- Cải thiện fanout_post_to_feed để xoá feed khi bài viết bị ẩn/xoá
CREATE OR REPLACE FUNCTION public.fanout_post_to_feed() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If post is deleted or inactive, remove it from all feeds
    IF NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id;
      RETURN NEW;
    END IF;

    -- If visibility changed from public/connections to private
    IF NEW.visibility NOT IN ('public', 'connections') THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id AND user_id <> NEW.author_id;
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
    -- Ensure author always has their own post
    INSERT INTO public.user_feeds (user_id, post_id, created_at)
    VALUES (NEW.author_id, NEW.id, NEW.created_at) ON CONFLICT DO NOTHING;

    IF NEW.visibility IN ('public', 'connections') THEN
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT to_user_id, NEW.id, NEW.created_at
        FROM public.user_connections_view
       WHERE from_user_id = NEW.author_id AND status = 'accepted'
       ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sync feed khi 2 người dùng kết nối hoặc huỷ kết nối
CREATE OR REPLACE FUNCTION public.sync_feeds_on_connection() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'accepted' THEN
      -- requester gets receiver's past posts (last 30 days)
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT NEW.requester_id, id, created_at FROM public.posts
       WHERE author_id = NEW.receiver_id AND status = 'active' AND deleted_at IS NULL
         AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
      ON CONFLICT DO NOTHING;

      -- receiver gets requester's past posts
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT NEW.receiver_id, id, created_at FROM public.posts
       WHERE author_id = NEW.requester_id AND status = 'active' AND deleted_at IS NULL
         AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'accepted' THEN
        -- Add to feeds
        INSERT INTO public.user_feeds (user_id, post_id, created_at)
        SELECT NEW.requester_id, id, created_at FROM public.posts
         WHERE author_id = NEW.receiver_id AND status = 'active' AND deleted_at IS NULL
           AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
        ON CONFLICT DO NOTHING;

        INSERT INTO public.user_feeds (user_id, post_id, created_at)
        SELECT NEW.receiver_id, id, created_at FROM public.posts
         WHERE author_id = NEW.requester_id AND status = 'active' AND deleted_at IS NULL
           AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
        ON CONFLICT DO NOTHING;
      ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
        -- Remove from feeds
        DELETE FROM public.user_feeds
         WHERE user_id = NEW.requester_id
           AND post_id IN (SELECT id FROM public.posts WHERE author_id = NEW.receiver_id);
        DELETE FROM public.user_feeds
         WHERE user_id = NEW.receiver_id
           AND post_id IN (SELECT id FROM public.posts WHERE author_id = NEW.requester_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'accepted' THEN
      DELETE FROM public.user_feeds
       WHERE user_id = OLD.requester_id
         AND post_id IN (SELECT id FROM public.posts WHERE author_id = OLD.receiver_id);
      DELETE FROM public.user_feeds
       WHERE user_id = OLD.receiver_id
         AND post_id IN (SELECT id FROM public.posts WHERE author_id = OLD.requester_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_feeds_on_connection ON public.connections;
CREATE TRIGGER trg_sync_feeds_on_connection
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_feeds_on_connection();

-- Backfill data cho các connections hiện có
INSERT INTO public.user_feeds (user_id, post_id, created_at)
SELECT ucv.to_user_id, p.id, p.created_at
  FROM public.user_connections_view ucv
  JOIN public.posts p ON p.author_id = ucv.from_user_id
 WHERE ucv.status = 'accepted'
   AND p.status = 'active' 
   AND p.deleted_at IS NULL
   AND p.visibility IN ('public', 'connections')
   AND p.created_at > NOW() - INTERVAL '30 days'
ON CONFLICT DO NOTHING;
