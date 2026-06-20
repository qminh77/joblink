-- 055_network_messaging_rpc_rls_fix
-- Fix RLS regressions after schema cleanup:
-- - network overview must not disappear because read RPCs are blocked by helper-table RLS.
-- - direct conversation creation must be able to insert both participants after business checks.
-- - message RPCs keep explicit participant/connection/block checks and run as SECURITY DEFINER.

BEGIN;

ALTER FUNCTION public.get_network_overview(INT) SECURITY DEFINER;
ALTER FUNCTION public.get_network_overview(INT) SET search_path = public;

ALTER FUNCTION public.get_messaging_overview(INT) SECURITY DEFINER;
ALTER FUNCTION public.get_messaging_overview(INT) SET search_path = public;

ALTER FUNCTION public.get_unread_conversations_count() SECURITY DEFINER;
ALTER FUNCTION public.get_unread_conversations_count() SET search_path = public;

ALTER FUNCTION public.get_conversation_messages(BIGINT, TIMESTAMPTZ, BIGINT, INT) SECURITY DEFINER;
ALTER FUNCTION public.get_conversation_messages(BIGINT, TIMESTAMPTZ, BIGINT, INT) SET search_path = public;

ALTER FUNCTION public.find_or_create_direct_conversation(BIGINT) SECURITY DEFINER;
ALTER FUNCTION public.find_or_create_direct_conversation(BIGINT) SET search_path = public;

ALTER FUNCTION public.send_message(BIGINT, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.send_message(BIGINT, TEXT) SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_me BIGINT;
  v_is_participant BOOLEAN;
BEGIN
  SELECT u.id INTO v_me
    FROM public.users u
   WHERE u.auth_id = auth.uid()
     AND u.deleted_at IS NULL
   LIMIT 1;

  IF v_me IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
  END IF;

  SELECT EXISTS(
    SELECT 1
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id
       AND cp.user_id = v_me
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant');
  END IF;

  UPDATE public.conversation_participants
     SET last_read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND user_id = v_me;

  UPDATE public.messages
     SET read_at = NOW()
   WHERE conversation_id = p_conversation_id
     AND sender_id <> v_me
     AND read_at IS NULL
     AND deleted_at IS NULL;

  RETURN jsonb_build_object('ok', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(BIGINT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
