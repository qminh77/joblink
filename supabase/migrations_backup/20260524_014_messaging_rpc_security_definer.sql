-- =============================================================================
-- JOBLINK MIGRATION 20260524_014 — MESSAGING RPC SECURITY DEFINER
-- =============================================================================
-- Vấn đề: `find_or_create_direct_conversation` (SECURITY INVOKER) INSERT vào
-- `conversations` qua RLS → "new row violates row-level security policy".
-- Có thể do RLS policy `conversations_insert_any` chưa tồn tại / sai cấu hình.
--
-- Cách sửa: chuyển 3 RPC mutate (find_or_create, send_message,
-- mark_conversation_read) sang SECURITY DEFINER. RPC đã tự validate (check
-- auth, participant, connection, block, rate-limit) nên an toàn hơn là phụ
-- thuộc RLS — không phá vỡ mô hình bảo mật.
--
-- Quy ước: dùng `SET search_path = public` để không bị attack qua schema
-- trỏ trước (Postgres best practice cho SECURITY DEFINER).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. find_or_create_direct_conversation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
    p_other_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_conv_id BIGINT;
    v_ok BOOLEAN;
    v_blocked BOOLEAN;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF v_me = p_other_user_id THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotMessageSelf');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND ((cn.requester_id = v_me AND cn.receiver_id = p_other_user_id)
             OR (cn.requester_id = p_other_user_id AND cn.receiver_id = v_me))
    ) INTO v_ok;

    IF NOT v_ok THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.user_blocks ub
         WHERE (ub.blocker_id = v_me AND ub.blocked_id = p_other_user_id)
            OR (ub.blocker_id = p_other_user_id AND ub.blocked_id = v_me)
    ) INTO v_blocked;

    IF v_blocked THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked');
    END IF;

    SELECT c.id INTO v_conv_id
      FROM public.conversations c
     WHERE c.type = 'direct'
       AND EXISTS(
           SELECT 1 FROM public.conversation_participants cp1
            WHERE cp1.conversation_id = c.id AND cp1.user_id = v_me
       )
       AND EXISTS(
           SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id
       )
       AND (
           SELECT COUNT(*) FROM public.conversation_participants cp3
            WHERE cp3.conversation_id = c.id
       ) = 2
     LIMIT 1;

    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations(type) VALUES ('direct')
        RETURNING id INTO v_conv_id;

        INSERT INTO public.conversation_participants(conversation_id, user_id)
        VALUES (v_conv_id, v_me), (v_conv_id, p_other_user_id);
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'conversationId', v_conv_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_or_create_direct_conversation(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. send_message
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_message(
    p_conversation_id BIGINT,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_other BIGINT;
    v_ok BOOLEAN;
    v_blocked BOOLEAN;
    v_recent INT;
    v_new_id BIGINT;
    v_created_at TIMESTAMPTZ;
    v_trim TEXT;
BEGIN
    v_trim := btrim(COALESCE(p_content, ''));
    IF v_trim = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent');
    END IF;
    IF char_length(v_trim) > 4000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'tooLong');
    END IF;

    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF NOT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant');
    END IF;

    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me
     LIMIT 1;

    SELECT EXISTS(
        SELECT 1 FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND ((cn.requester_id = v_me AND cn.receiver_id = v_other)
             OR (cn.requester_id = v_other AND cn.receiver_id = v_me))
    ) INTO v_ok;

    IF NOT v_ok THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.user_blocks ub
         WHERE (ub.blocker_id = v_me AND ub.blocked_id = v_other)
            OR (ub.blocker_id = v_other AND ub.blocked_id = v_me)
    ) INTO v_blocked;

    IF v_blocked THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked');
    END IF;

    SELECT COUNT(*)::INT INTO v_recent
      FROM public.messages m
     WHERE m.sender_id = v_me
       AND m.created_at >= NOW() - INTERVAL '1 minute';

    IF v_recent >= 60 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'rateLimited');
    END IF;

    INSERT INTO public.messages(conversation_id, sender_id, content)
    VALUES (p_conversation_id, v_me, v_trim)
    RETURNING id, created_at INTO v_new_id, v_created_at;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'message', jsonb_build_object(
            'id', v_new_id,
            'senderId', v_me,
            'content', v_trim,
            'media', NULL,
            'readAt', NULL,
            'createdAt', v_created_at
        ),
        'recipientId', v_other
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(BIGINT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. mark_conversation_read
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    -- Chỉ user tự mark conversation MÌNH tham gia
    IF NOT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) THEN
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

-- =============================================================================
-- END MIGRATION 20260524_014
-- =============================================================================
