-- =============================================================================
-- JOBLINK MIGRATION 20260521_007 — REALTIME ENGAGEMENT (M03)
-- =============================================================================
-- Bật replication realtime cho engagement của posts:
--   • post_reactions — like/unlike → cập nhật reactionCount/viewerReacted
--   • post_comments  — bình luận mới/xoá → cập nhật commentCount + thread
--   • post_shares    — chia sẻ → cập nhật shareCount
-- Idempotent: chạy lại nhiều lần không lỗi.
-- =============================================================================

-- REPLICA IDENTITY DEFAULT bắt buộc cho Supabase Realtime để stream
-- UPDATE/DELETE payload đầy đủ theo primary key.
ALTER TABLE public.post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_comments  REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_shares    REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_reactions'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_comments'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_shares'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_shares';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'posts'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.posts';
    END IF;
END
$$;

-- =============================================================================
-- END MIGRATION 20260521_007
-- =============================================================================
