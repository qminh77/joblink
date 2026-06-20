-- =============================================================================
-- #4: Fan-out optimization — Hybrid fan-out cho feed
-- Chỉ ghi user_feeds cho connections "active" (có tương tác trong 7 ngày qua).
-- Connections "inactive" sẽ dùng pull mode khi cần.
-- =============================================================================

-- Bảng theo dõi lần hoạt động cuối của mỗi user (updated by triggers)
CREATE TABLE IF NOT EXISTS public.user_last_active (
  user_id    BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_last_active
  ON public.user_last_active(last_active);

-- RLS
ALTER TABLE public.user_last_active ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_last_active_select_all"
  ON public.user_last_active FOR SELECT
  USING (true);

CREATE POLICY "user_last_active_insert_own"
  ON public.user_last_active FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

CREATE POLICY "user_last_active_update_own"
  ON public.user_last_active FOR UPDATE
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

-- Trigger function: cập nhật last_active khi user đăng bài, bình luận, reaction
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_last_active (user_id, last_active)
  VALUES (NEW.author_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_active = NOW();
  RETURN NEW;
END;
$$;

-- Trigger trên posts: khi user đăng bài → cập nhật last_active
DROP TRIGGER IF EXISTS trg_update_last_active_on_post ON public.posts;
CREATE TRIGGER trg_update_last_active_on_post
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_last_active();

-- =============================================================================
-- Cải thiện fanout_post_to_feed: Hybrid fan-out
-- Chỉ fan-out cho connections có last_active trong 7 ngày qua.
-- Connections không active sẽ pull bài viết khi mở home feed.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fanout_post_to_feed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Xoá feed nếu bài bị ẩn/xoá
    IF NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id;
      RETURN NEW;
    END IF;

    -- Nếu visibility thay đổi từ public/connections → private
    IF NEW.visibility NOT IN ('public', 'connections') THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id AND user_id <> NEW.author_id;
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
    -- Author luôn có bài của mình trong feed
    INSERT INTO public.user_feeds (user_id, post_id, created_at)
    VALUES (NEW.author_id, NEW.id, NEW.created_at)
    ON CONFLICT DO NOTHING;

    IF NEW.visibility IN ('public', 'connections') THEN
      -- HYBRID: Chỉ fan-out cho connections ACTIVE trong 7 ngày qua
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT ucv.to_user_id, NEW.id, NEW.created_at
        FROM public.user_connections_view ucv
        LEFT JOIN public.user_last_active ula ON ula.user_id = ucv.to_user_id
       WHERE ucv.from_user_id = NEW.author_id
         AND ucv.status = 'accepted'
         AND (
           ula.last_active IS NOT NULL
           AND ula.last_active > NOW() - INTERVAL '7 days'
         )
      ON CONFLICT DO NOTHING;
      -- Connections inactive sẽ được pull khi mở home feed (pull mode)
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Grant permission cho user_last_active
GRANT SELECT ON public.user_last_active TO authenticated;
