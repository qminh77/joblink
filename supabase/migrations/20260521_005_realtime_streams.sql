-- =============================================================================
-- JOBLINK MIGRATION 20260521_005 — REALTIME STREAMS (M07 + M04)
-- =============================================================================
-- Mục tiêu:
--   • Bật replication cho notifications + connections vào publication
--     `supabase_realtime` để client subscribe được postgres_changes.
--   • Đặt REPLICA IDENTITY DEFAULT (theo primary key) trên các bảng này — bắt
--     buộc cho Supabase Realtime để chuyển payload UPDATE/DELETE.
--   • Idempotent: chạy lại nhiều lần không lỗi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Đảm bảo publication tồn tại (Supabase tạo sẵn, fallback an toàn)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2. REPLICA IDENTITY — Supabase yêu cầu để stream UPDATE/DELETE đúng
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications REPLICA IDENTITY DEFAULT;
ALTER TABLE public.connections   REPLICA IDENTITY DEFAULT;

-- -----------------------------------------------------------------------------
-- 3. Add bảng vào publication (idempotent qua check pg_publication_tables)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'notifications'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'connections'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.connections';
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 4. Bổ sung index hỗ trợ unread badge (đã có idx_notifications_user_unread
--    trên (user_id, read_at, created_at) trong schema.sql) — thêm partial
--    index riêng cho read_at IS NULL để count(*) WHERE read_at IS NULL nhanh
--    hơn với volume lớn.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_only
    ON public.notifications(user_id, created_at DESC)
    WHERE read_at IS NULL;

-- =============================================================================
-- END MIGRATION 20260521_005
-- =============================================================================
