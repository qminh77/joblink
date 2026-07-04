-- =============================================================================
-- JOBLINK MIGRATION 20260520_001 — HOME FEED PERFORMANCE LAYER 1
-- =============================================================================
-- Mục tiêu:
--   • Thay count(*) bằng counter cache O(1) trên users (connection_count,
--     profile_view_count) — duy trì bằng trigger.
--   • Thêm composite indexes phục vụ home feed (connections, profile_view_logs,
--     posts theo connection-based feed).
--   • Backfill counter một lần cho dữ liệu hiện có.
--
-- Idempotent: chạy lại nhiều lần không lỗi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Thêm cột counter trên users
-- -----------------------------------------------------------------------------
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS connection_count   INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS profile_view_count INT NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. Composite indexes cho hot paths
-- -----------------------------------------------------------------------------
-- Tra cứu "ai đang accepted với user X" — đi cả hai chiều requester/receiver.
CREATE INDEX IF NOT EXISTS idx_connections_req_status_pair
    ON public.connections(requester_id, status, receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_pair
    ON public.connections(receiver_id, status, requester_id);

-- profile_view_logs: lookup theo target + thời gian gần đây.
CREATE INDEX IF NOT EXISTS idx_profile_view_target_recent
    ON public.profile_view_logs(target_user_id, viewed_at DESC);

-- Posts feed: lấy theo created_at giảm dần, với author filter.
CREATE INDEX IF NOT EXISTS idx_posts_created_active
    ON public.posts(created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_posts_author_created_active
    ON public.posts(author_id, created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active';

-- Post engagement counts (sẽ thường được aggregate).
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user
    ON public.post_reactions(post_id, user_id);

-- -----------------------------------------------------------------------------
-- 3. Triggers maintain connection_count
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.connections_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'accepted' THEN
            UPDATE public.users SET connection_count = connection_count + 1
                WHERE id IN (NEW.requester_id, NEW.receiver_id);
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Chỉ counted khi status = 'accepted'.
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
                UPDATE public.users SET connection_count = connection_count + 1
                    WHERE id IN (NEW.requester_id, NEW.receiver_id);
            ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
                UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                    WHERE id IN (OLD.requester_id, OLD.receiver_id);
            END IF;
        END IF;
        -- Trường hợp chuyển requester/receiver (reset rồi gửi lại) — đã accepted
        -- đổi cặp user thì counter cần điều chỉnh ở cả hai phía.
        IF NEW.status = 'accepted'
           AND OLD.status = 'accepted'
           AND (OLD.requester_id, OLD.receiver_id)
               IS DISTINCT FROM (NEW.requester_id, NEW.receiver_id) THEN
            UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                WHERE id IN (OLD.requester_id, OLD.receiver_id);
            UPDATE public.users SET connection_count = connection_count + 1
                WHERE id IN (NEW.requester_id, NEW.receiver_id);
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'accepted' THEN
            UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                WHERE id IN (OLD.requester_id, OLD.receiver_id);
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_connections_counter ON public.connections;
CREATE TRIGGER trg_connections_counter
    AFTER INSERT OR UPDATE OR DELETE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.connections_counter_trigger();

-- -----------------------------------------------------------------------------
-- 4. Trigger maintain profile_view_count
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profile_view_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.users SET profile_view_count = profile_view_count + 1
            WHERE id = NEW.target_user_id;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE public.users SET profile_view_count = GREATEST(0, profile_view_count - 1)
            WHERE id = OLD.target_user_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_view_counter ON public.profile_view_logs;
CREATE TRIGGER trg_profile_view_counter
    AFTER INSERT OR DELETE ON public.profile_view_logs
    FOR EACH ROW EXECUTE FUNCTION public.profile_view_counter_trigger();

-- -----------------------------------------------------------------------------
-- 5. Backfill counter một lần (chỉ chạy nếu dữ liệu hiện tại lệch)
-- -----------------------------------------------------------------------------
WITH conn_counts AS (
    SELECT u.id,
           (SELECT COUNT(*) FROM public.connections c
              WHERE c.status = 'accepted'
                AND (c.requester_id = u.id OR c.receiver_id = u.id)) AS cnt
    FROM public.users u
),
view_counts AS (
    SELECT u.id,
           (SELECT COUNT(*) FROM public.profile_view_logs v
              WHERE v.target_user_id = u.id) AS cnt
    FROM public.users u
)
UPDATE public.users u
   SET connection_count   = cc.cnt,
       profile_view_count = vc.cnt
  FROM conn_counts cc, view_counts vc
 WHERE cc.id = u.id AND vc.id = u.id
   AND (u.connection_count <> cc.cnt OR u.profile_view_count <> vc.cnt);

-- =============================================================================
-- END MIGRATION 20260520_001
-- =============================================================================
