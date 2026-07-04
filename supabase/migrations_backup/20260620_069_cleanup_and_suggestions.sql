-- =============================================================================
-- #11: Cleanup & Network Suggestions Refresh
-- RPC để gọi từ外部 cron job hoặc admin panel.
-- =============================================================================

-- Refresh network_suggestions: tính lại gợi ý kết nối cho tất cả users
CREATE OR REPLACE FUNCTION public.refresh_network_suggestions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refreshed INT := 0;
  v_user RECORD;
BEGIN
  -- Xoá suggestions cũ
  TRUNCATE public.network_suggestions;

  -- Tính gợi ý cho mỗi user active
  FOR v_user IN
    SELECT id FROM public.users
     WHERE role = 'member' AND status = 'active' AND deleted_at IS NULL
  LOOP
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT
      v_user.id,
      candidate.id,
      -- Score:共同 connections + 共同 skills
      (
        SELECT COUNT(DISTINCT uc2.to_user_id)
        FROM public.user_connections_view uc1
        JOIN public.user_connections_view uc2
          ON uc1.to_user_id = uc2.to_user_id AND uc2.status = 'accepted'
        WHERE uc1.from_user_id = v_user.id
          AND uc1.status = 'accepted'
          AND uc2.from_user_id = candidate.id
      ) * 10
      +
      (
        SELECT COUNT(DISTINCT ms2.skill_id)
        FROM public.member_skills ms1
        JOIN public.member_skills ms2 ON ms1.skill_id = ms2.skill_id
        WHERE ms1.user_id = v_user.id AND ms2.user_id = candidate.id
      ) * 5
    AS score
    FROM public.users candidate
    WHERE candidate.id <> v_user.id
      AND candidate.role = 'member'
      AND candidate.status = 'active'
      AND candidate.deleted_at IS NULL
      AND candidate.id NOT IN (
        SELECT to_user_id FROM public.user_connections_view
         WHERE from_user_id = v_user.id
      )
    ORDER BY score DESC
    LIMIT 20
    ON CONFLICT DO NOTHING;

    v_refreshed := v_refreshed + 1;
  END LOOP;

  RETURN v_refreshed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_network_suggestions() TO service_role;

-- =============================================================================
-- Trigger: Xoá network_suggestions khi connection thay đổi
-- (giữ suggestions liên quan đến connections mới accepted)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_suggestions_on_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    -- Xoá suggestions giữa 2 người vừa kết nối (không còn cần gợi ý)
    DELETE FROM public.network_suggestions
     WHERE (user_id = NEW.requester_id AND suggested_user_id = NEW.receiver_id)
        OR (user_id = NEW.receiver_id AND suggested_user_id = NEW.requester_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_suggestions_on_connection ON public.connections;
CREATE TRIGGER trg_sync_suggestions_on_connection
  AFTER INSERT OR UPDATE OF status ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_suggestions_on_connection();
