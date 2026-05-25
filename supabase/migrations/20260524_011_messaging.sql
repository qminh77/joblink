-- =============================================================================
-- JOBLINK MIGRATION 20260524_011 — MESSAGING (M06)
-- =============================================================================
-- Mục tiêu:
--   • Index hot path cho conversation list / chat panel / unread count.
--   • Trigger bump conversations.updated_at + reset participant.last_read_at
--     của sender khi insert message (để chính sender không tự count unread).
--   • RPC tổng hợp:
--       - get_messaging_overview()              → list conversation (left rail)
--       - get_conversation_messages()           → paginated history (chat panel)
--       - find_or_create_direct_conversation()  → mở chat từ profile
--       - send_message()                        → insert + auto-bump + mark read
--       - mark_conversation_read()              → reset last_read_at
--       - get_unread_conversations_count()      → badge global
--   • Bật realtime cho messages + conversation_participants để client invalidate
--     react-query cache tức thời. Không polling.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- Lấy lịch sử conversation theo created_at DESC (newest-first cursor)
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc
    ON public.messages(conversation_id, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- Đếm unread per conversation: COUNT WHERE created_at > last_read_at AND sender_id <> me
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender_created
    ON public.messages(conversation_id, sender_id, created_at)
    WHERE deleted_at IS NULL;

-- Lấy danh sách conversation của user theo "vừa có hoạt động"
CREATE INDEX IF NOT EXISTS idx_conversations_updated_desc
    ON public.conversations(updated_at DESC);

-- conversation_participants per user (đã có idx_conv_participants_user, partial cho hot path)
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_lastread
    ON public.conversation_participants(user_id, last_read_at);

-- -----------------------------------------------------------------------------
-- 2. Trigger: khi message mới insert → bump conversations.updated_at và auto
--    update last_read_at của sender (vì chính họ vừa "đọc" tin của mình).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.joblink_after_message_insert()
RETURNS trigger AS $$
BEGIN
    UPDATE public.conversations
       SET updated_at = NEW.created_at
     WHERE id = NEW.conversation_id;

    UPDATE public.conversation_participants
       SET last_read_at = NEW.created_at
     WHERE conversation_id = NEW.conversation_id
       AND user_id = NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_messages_after_insert ON public.messages;
CREATE TRIGGER trg_messages_after_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.joblink_after_message_insert();

-- -----------------------------------------------------------------------------
-- 3. RPC: get_messaging_overview — danh sách conversation của user hiện tại
--    kèm thông tin người đối diện, last message và unread count.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_messaging_overview(
    p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_items JSONB;
    v_unread_total INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object(
            'items', '[]'::jsonb,
            'unreadConversations', 0
        );
    END IF;

    WITH my_conv AS (
        SELECT cp.conversation_id, cp.last_read_at
          FROM public.conversation_participants cp
         WHERE cp.user_id = v_me
    ),
    other_part AS (
        SELECT mc.conversation_id, cp.user_id AS other_user_id, mc.last_read_at
          FROM my_conv mc
          JOIN public.conversation_participants cp
            ON cp.conversation_id = mc.conversation_id
           AND cp.user_id <> v_me
    ),
    last_msg AS (
        SELECT DISTINCT ON (m.conversation_id)
               m.conversation_id,
               m.id          AS last_message_id,
               m.sender_id   AS last_sender_id,
               m.content     AS last_content,
               m.media       AS last_media,
               m.created_at  AS last_created_at
          FROM public.messages m
         WHERE m.deleted_at IS NULL
           AND m.conversation_id IN (SELECT conversation_id FROM my_conv)
         ORDER BY m.conversation_id, m.created_at DESC, m.id DESC
    ),
    unread AS (
        SELECT m.conversation_id, COUNT(*)::INT AS unread_count
          FROM public.messages m
          JOIN my_conv mc ON mc.conversation_id = m.conversation_id
         WHERE m.deleted_at IS NULL
           AND m.sender_id <> v_me
           AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
         GROUP BY m.conversation_id
    ),
    rows AS (
        SELECT
            c.id                              AS "conversationId",
            c.updated_at                      AS "updatedAt",
            op.other_user_id                  AS "otherUserId",
            COALESCE(mp.full_name, cp.name)   AS "displayName",
            COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
            COALESCE(mp.headline, cp.industry)   AS "headline",
            u.role                            AS role,
            lm.last_message_id                AS "lastMessageId",
            lm.last_sender_id                 AS "lastSenderId",
            lm.last_content                   AS "lastContent",
            lm.last_media                     AS "lastMedia",
            lm.last_created_at                AS "lastCreatedAt",
            COALESCE(unr.unread_count, 0)     AS "unreadCount",
            EXISTS (
                SELECT 1 FROM public.connections cn
                 WHERE cn.status = 'accepted'
                   AND ((cn.requester_id = v_me AND cn.receiver_id = op.other_user_id)
                     OR (cn.requester_id = op.other_user_id AND cn.receiver_id = v_me))
            ) AS "isConnected",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = v_me AND ub.blocked_id = op.other_user_id
            ) AS "blockedByMe",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = op.other_user_id AND ub.blocked_id = v_me
            ) AS "blockedMe"
          FROM other_part op
          JOIN public.conversations c   ON c.id = op.conversation_id
          JOIN public.users u           ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
          LEFT JOIN last_msg lm ON lm.conversation_id = op.conversation_id
          LEFT JOIN unread   unr ON unr.conversation_id = op.conversation_id
         ORDER BY
            COALESCE(lm.last_created_at, c.updated_at) DESC
         LIMIT p_limit
    )
    SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
      INTO v_items
      FROM rows r;

    SELECT COUNT(*)::INT
      INTO v_unread_total
      FROM my_conv mc
      JOIN public.messages m ON m.conversation_id = mc.conversation_id
     WHERE m.deleted_at IS NULL
       AND m.sender_id <> v_me
       AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
       AND EXISTS (
           SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = mc.conversation_id
              AND cp.user_id = v_me
       );

    RETURN jsonb_build_object(
        'items', v_items,
        'unreadConversations', COALESCE((
            SELECT COUNT(*)::INT FROM (
                SELECT 1 FROM jsonb_array_elements(v_items) e
                 WHERE (e->>'unreadCount')::INT > 0
            ) s
        ), 0)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_overview(INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: get_unread_conversations_count — chỉ count distinct conversation có
--    tin chưa đọc. Dùng cho badge global ở navbar.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_unread_conversations_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_count INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN RETURN 0; END IF;

    SELECT COUNT(DISTINCT m.conversation_id)::INT
      INTO v_count
      FROM public.conversation_participants cp
      JOIN public.messages m ON m.conversation_id = cp.conversation_id
     WHERE cp.user_id = v_me
       AND m.deleted_at IS NULL
       AND m.sender_id <> v_me
       AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at);

    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_conversations_count() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: get_conversation_messages — phân trang DESC theo created_at + id
--    Trả về thêm "otherUserId" để client biết hiển thị tên/avatar.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_conversation_messages(
    p_conversation_id BIGINT,
    p_before_created_at TIMESTAMPTZ DEFAULT NULL,
    p_before_id BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 40
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_is_participant BOOLEAN;
    v_other_user_id BIGINT;
    v_items JSONB;
    v_has_more BOOLEAN;
    v_limit INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL);
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) INTO v_is_participant;

    IF NOT v_is_participant THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL);
    END IF;

    SELECT cp.user_id INTO v_other_user_id
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me
     LIMIT 1;

    v_limit := GREATEST(LEAST(COALESCE(p_limit, 40), 100), 1);

    WITH page AS (
        SELECT m.id,
               m.sender_id,
               m.content,
               m.media,
               m.read_at,
               m.created_at
          FROM public.messages m
         WHERE m.conversation_id = p_conversation_id
           AND m.deleted_at IS NULL
           AND (
               p_before_created_at IS NULL
               OR m.created_at < p_before_created_at
               OR (m.created_at = p_before_created_at AND m.id < COALESCE(p_before_id, 9223372036854775807))
           )
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT v_limit + 1
    ),
    sliced AS (
        SELECT * FROM page LIMIT v_limit
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', s.id,
            'senderId', s.sender_id,
            'content', s.content,
            'media', s.media,
            'readAt', s.read_at,
            'createdAt', s.created_at
        ) ORDER BY s.created_at ASC, s.id ASC), '[]'::jsonb),
        (SELECT COUNT(*) FROM page) > v_limit
      INTO v_items, v_has_more
      FROM sliced s;

    RETURN jsonb_build_object(
        'items', v_items,
        'hasMore', COALESCE(v_has_more, FALSE),
        'otherUserId', v_other_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_messages(BIGINT, TIMESTAMPTZ, BIGINT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: find_or_create_direct_conversation — mở chat từ profile.
--    Trả về conversation_id; tạo mới nếu chưa có. Yêu cầu: connected hai chiều
--    (status = accepted). Không tạo nếu đang bị block ở bất kỳ chiều nào.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
    p_other_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
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

    -- Phải có connection accepted hai chiều
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

    -- Tìm conversation 1-1 có đúng 2 người (me + other)
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
-- 7. RPC: send_message — kiểm tra connection + block + rate limit (60/min), rồi
--    insert và trả về row mới. Dùng RPC để bundle nhiều check vào 1 round-trip.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_message(
    p_conversation_id BIGINT,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
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

    -- Phải là participant
    IF NOT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant');
    END IF;

    -- Tìm người đối diện
    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me
     LIMIT 1;

    -- Vẫn phải connected
    SELECT EXISTS(
        SELECT 1 FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND ((cn.requester_id = v_me AND cn.receiver_id = v_other)
             OR (cn.requester_id = v_other AND cn.receiver_id = v_me))
    ) INTO v_ok;

    IF NOT v_ok THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected');
    END IF;

    -- Không gửi khi bị block
    SELECT EXISTS(
        SELECT 1 FROM public.user_blocks ub
         WHERE (ub.blocker_id = v_me AND ub.blocked_id = v_other)
            OR (ub.blocker_id = v_other AND ub.blocked_id = v_me)
    ) INTO v_blocked;

    IF v_blocked THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked');
    END IF;

    -- Rate limit: 60 tin/phút/user (NFR-S-008)
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
-- 8. RPC: mark_conversation_read — set last_read_at = NOW() (chỉ row của me).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
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

    UPDATE public.conversation_participants
       SET last_read_at = NOW()
     WHERE conversation_id = p_conversation_id
       AND user_id = v_me;

    -- Cũng cập nhật read_at cho các message của người kia (để hiển thị "đã xem")
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

-- -----------------------------------------------------------------------------
-- 9. Realtime: bật replication cho messages, conversations,
--    conversation_participants để client subscribe được postgres_changes.
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages                  REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversations             REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversation_participants REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'messages'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'conversations'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'conversation_participants'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants';
    END IF;
END
$$;

-- =============================================================================
-- END MIGRATION 20260524_011
-- =============================================================================
