-- Migration 059: Fix Messaging Realtime by replacing JOIN with direct column in RLS

-- 1. Add receiver_id column to messages table
ALTER TABLE public.messages ADD COLUMN receiver_id BIGINT NULL REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Backfill receiver_id for existing messages
UPDATE public.messages m
   SET receiver_id = (
       SELECT cp.user_id 
         FROM public.conversation_participants cp 
        WHERE cp.conversation_id = m.conversation_id 
          AND cp.user_id <> m.sender_id 
        LIMIT 1
   )
 WHERE m.receiver_id IS NULL;

-- 3. Drop old policy and recreate it with direct column check
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
CREATE POLICY messages_select_participant ON public.messages
    FOR SELECT TO authenticated
    USING (
        sender_id = public.auth_user_id() OR receiver_id = public.auth_user_id() OR
        public.is_my_conversation(conversation_id)
    );

-- 4. Update send_message RPC to populate receiver_id
CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id BIGINT, p_content TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_other BIGINT; v_ok BOOLEAN; v_blocked BOOLEAN;
    v_recent INT; v_new_id BIGINT; v_created_at TIMESTAMPTZ; v_trim TEXT;
BEGIN
    v_trim := btrim(COALESCE(p_content, ''));
    IF v_trim = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent'); END IF;
    IF char_length(v_trim) > 4000 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'tooLong'); END IF;
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.conversation_participants
                   WHERE conversation_id = p_conversation_id AND user_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant'); END IF;
    SELECT cp.user_id INTO v_other FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me LIMIT 1;
    SELECT EXISTS(SELECT 1 FROM public.connections cn WHERE cn.status = 'accepted'
        AND ((cn.requester_id = v_me AND cn.receiver_id = v_other)
          OR (cn.requester_id = v_other AND cn.receiver_id = v_me))) INTO v_ok;
    IF NOT v_ok THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected'); END IF;
    SELECT EXISTS(SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_me AND ub.blocked_id = v_other)
           OR (ub.blocker_id = v_other AND ub.blocked_id = v_me)) INTO v_blocked;
    IF v_blocked THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked'); END IF;
    SELECT COUNT(*)::INT INTO v_recent FROM public.messages m
     WHERE m.sender_id = v_me AND m.created_at >= NOW() - INTERVAL '1 minute';
    IF v_recent >= 60 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'rateLimited'); END IF;
    INSERT INTO public.messages(conversation_id, sender_id, receiver_id, content)
    VALUES (p_conversation_id, v_me, v_other, v_trim) RETURNING id, created_at INTO v_new_id, v_created_at;
    RETURN jsonb_build_object('ok', TRUE, 'message', jsonb_build_object(
        'id', v_new_id, 'senderId', v_me, 'content', v_trim, 'media', NULL,
        'readAt', NULL, 'createdAt', v_created_at), 'recipientId', v_other);
END;
$$;
