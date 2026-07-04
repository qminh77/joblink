-- =============================================================================
-- JOBLINK MIGRATION 20260524_012 — FIX RLS RECURSION TRÊN MESSAGING TABLES
-- =============================================================================
-- Vấn đề: policy `conversation_participants_select` trong rls_policies.sql có
-- subquery EXISTS query lại chính `conversation_participants` → infinite
-- recursion khi Postgres đánh giá RLS.
--
-- Cách sửa:
--   • Tạo helper SECURITY DEFINER `is_my_conversation(conv_id)` — bypass RLS
--     khi check "user hiện tại có phải participant của conversation X không".
--   • Recreate policies SELECT của 3 bảng (conversations, conversation_part-
--     icipants, messages) dùng helper này, không subquery vòng tròn.
--   • Idempotent: DROP POLICY IF EXISTS rồi CREATE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper bypass RLS: kiểm tra user hiện tại có phải participant không
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_my_conversation(p_conversation_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
      FROM public.conversation_participants cp
      JOIN public.users u ON u.id = cp.user_id
     WHERE cp.conversation_id = p_conversation_id
       AND u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_conversation(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. conversation_participants — policy SELECT không tự query lại chính nó
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversation_participants_select       ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_admin_all    ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_insert_own   ON public.conversation_participants;

CREATE POLICY conversation_participants_admin_all
  ON public.conversation_participants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Cho phép user xem TẤT CẢ participant của các conversation mà mình là thành
-- viên (cần để biết "người đối diện" trong direct chat).
CREATE POLICY conversation_participants_select
  ON public.conversation_participants
  FOR SELECT
  USING (public.is_my_conversation(conversation_id));

CREATE POLICY conversation_participants_insert_own
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

-- Cho phép user cập nhật last_read_at của chính mình
DROP POLICY IF EXISTS conversation_participants_update_own ON public.conversation_participants;
CREATE POLICY conversation_participants_update_own
  ON public.conversation_participants
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

-- -----------------------------------------------------------------------------
-- 3. conversations — dùng helper, không subquery cp trực tiếp
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_admin_all          ON public.conversations;
DROP POLICY IF EXISTS conversations_select_participant ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_any         ON public.conversations;

CREATE POLICY conversations_admin_all
  ON public.conversations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY conversations_select_participant
  ON public.conversations
  FOR SELECT
  USING (public.is_my_conversation(id));

CREATE POLICY conversations_insert_any
  ON public.conversations
  FOR INSERT
  WITH CHECK (TRUE);

-- Cho phép trigger sau-insert message cập nhật updated_at của conversation.
-- Trigger chạy với quyền SECURITY DEFINER của joblink_after_message_insert(),
-- nhưng để dev tools (REST) cũng làm được khi cần, mở UPDATE cho participant.
DROP POLICY IF EXISTS conversations_update_participant ON public.conversations;
CREATE POLICY conversations_update_participant
  ON public.conversations
  FOR UPDATE
  USING (public.is_my_conversation(id))
  WITH CHECK (public.is_my_conversation(id));

-- -----------------------------------------------------------------------------
-- 4. messages — dùng helper thay cho EXISTS query cp
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_admin_all          ON public.messages;
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
DROP POLICY IF EXISTS messages_insert_own         ON public.messages;
DROP POLICY IF EXISTS messages_update_own         ON public.messages;

CREATE POLICY messages_admin_all
  ON public.messages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY messages_select_participant
  ON public.messages
  FOR SELECT
  USING (public.is_my_conversation(conversation_id));

CREATE POLICY messages_insert_own
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = public.auth_user_id()
    AND public.is_my_conversation(conversation_id)
  );

CREATE POLICY messages_update_own
  ON public.messages
  FOR UPDATE
  USING (sender_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (sender_id = public.auth_user_id());

-- Cho phép participant đánh dấu đã đọc (read_at) các message của người kia.
-- mark_conversation_read RPC sẽ UPDATE read_at cho messages sender_id <> me.
DROP POLICY IF EXISTS messages_update_read ON public.messages;
CREATE POLICY messages_update_read
  ON public.messages
  FOR UPDATE
  USING (public.is_my_conversation(conversation_id))
  WITH CHECK (public.is_my_conversation(conversation_id));

-- =============================================================================
-- END MIGRATION 20260524_012
-- =============================================================================
