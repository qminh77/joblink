-- =============================================================================
-- JOBLINK MIGRATION 20260622_076 — MESSAGING O(1) ARCHITECTURE
-- =============================================================================
-- Mục tiêu:
--   • Thêm `seq` vào bảng `conversations`.
--   • Cập nhật `last_message_*` và `seq` thẳng vào `conversations` khi send.
--   • Loại bỏ CTE trong `get_messaging_overview` để đạt độ phức tạp O(1).
--   • Xoá các trigger dư thừa.
-- =============================================================================

-- 1. Thêm cột seq vào conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS seq INT NOT NULL DEFAULT 0;

-- (Các cột last_message_id, last_content, last_sender_id, last_message_created_at đã có sẵn trong schema,
-- nhưng có thể chưa được dùng. Thêm IF NOT EXISTS để đảm bảo).
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_id BIGINT,
  ADD COLUMN IF NOT EXISTS last_content TEXT,
  ADD COLUMN IF NOT EXISTS last_sender_id BIGINT,
  ADD COLUMN IF NOT EXISTS last_message_created_at TIMESTAMPTZ;

-- 2. Data Backfill: Cập nhật dữ liệu cũ từ bảng messages vào conversations
WITH last_messages AS (
    SELECT DISTINCT ON (conversation_id)
           conversation_id,
           id,
           content,
           sender_id,
           created_at
      FROM public.messages
     WHERE deleted_at IS NULL
     ORDER BY conversation_id, created_at DESC, id DESC
)
UPDATE public.conversations c
   SET last_message_id = lm.id,
       last_content = lm.content,
       last_sender_id = lm.sender_id,
       last_message_created_at = lm.created_at,
       seq = (SELECT COUNT(*) FROM public.messages WHERE conversation_id = c.id AND deleted_at IS NULL)
  FROM last_messages lm
 WHERE c.id = lm.conversation_id;

-- 3. Xoá Trigger cũ
DROP TRIGGER IF EXISTS trg_messages_after_insert ON public.messages;
DROP FUNCTION IF EXISTS public.joblink_after_message_insert();

-- 4. Cập nhật RPC send_message để tự xử lý logic cập nhật O(1)
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

    -- Rate limit: 60 tin/phút/user
    SELECT COUNT(*)::INT INTO v_recent
      FROM public.messages m
     WHERE m.sender_id = v_me
       AND m.created_at >= NOW() - INTERVAL '1 minute';

    IF v_recent >= 60 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'rateLimited');
    END IF;

    -- 1. Insert message
    INSERT INTO public.messages(conversation_id, sender_id, content)
    VALUES (p_conversation_id, v_me, v_trim)
    RETURNING id, created_at INTO v_new_id, v_created_at;

    -- 2. Update conversation (O(1) updates)
    UPDATE public.conversations
       SET updated_at = v_created_at,
           last_message_id = v_new_id,
           last_sender_id = v_me,
           last_content = v_trim,
           last_message_created_at = v_created_at,
           seq = seq + 1
     WHERE id = p_conversation_id;

    -- 3. Update last_read_at cho sender (coi như đã đọc)
    UPDATE public.conversation_participants
       SET last_read_at = v_created_at
     WHERE conversation_id = p_conversation_id
       AND user_id = v_me;

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

-- 5. Cập nhật RPC get_messaging_overview (O(1) lấy tin nhắn mới nhất trực tiếp từ bảng conversations)
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
    unread AS (
        SELECT m.conversation_id, COUNT(*)::INT AS unread_count
          FROM public.messages m
          JOIN my_conv mc ON mc.conversation_id = m.conversation_id
         WHERE m.deleted_at IS NULL
           AND m.sender_id <> v_me
           AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
         GROUP BY m.conversation_id
    ),
    convo_rows AS (
        SELECT
            c.id                              AS "conversationId",
            c.updated_at                      AS "updatedAt",
            c.seq                             AS "seq",
            op.other_user_id                  AS "otherUserId",
            COALESCE(mp.full_name, cp.name)   AS "displayName",
            COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
            COALESCE(mp.headline, cp.industry)   AS "headline",
            u.role                            AS role,
            c.last_message_id                 AS "lastMessageId",
            c.last_sender_id                  AS "lastSenderId",
            c.last_content                    AS "lastContent",
            NULL                              AS "lastMedia",
            c.last_message_created_at         AS "lastCreatedAt",
            COALESCE(unr.unread_count, 0)     AS "unreadCount",
            TRUE                              AS "isConnected",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = v_me AND ub.blocked_id = op.other_user_id
            ) AS "blockedByMe",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = op.other_user_id AND ub.blocked_id = v_me
            ) AS "blockedMe",
            COALESCE(c.last_message_created_at, c.updated_at) AS sort_key
          FROM other_part op
          JOIN public.conversations c   ON c.id = op.conversation_id
          JOIN public.users u           ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
          LEFT JOIN unread   unr ON unr.conversation_id = op.conversation_id
    ),
    my_connections AS (
        SELECT CASE WHEN cn.requester_id = v_me THEN cn.receiver_id ELSE cn.requester_id END AS other_id,
               COALESCE(cn.responded_at, cn.requested_at) AS connected_at
          FROM public.connections cn
         WHERE cn.status = 'accepted' AND (cn.requester_id = v_me OR cn.receiver_id = v_me)
    ),
    connections_without_convo AS (
        SELECT mc.other_id, mc.connected_at FROM my_connections mc
         WHERE mc.other_id NOT IN (SELECT "otherUserId" FROM convo_rows)
    ),
    placeholder_rows AS (
        SELECT NULL::BIGINT AS "conversationId", cwc.connected_at AS "updatedAt",
               NULL::INT AS "seq",
               cwc.other_id AS "otherUserId",
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline", u.role AS role,
               NULL::BIGINT AS "lastMessageId", NULL::BIGINT AS "lastSenderId",
               NULL::TEXT AS "lastContent", NULL::JSONB AS "lastMedia",
               NULL::TIMESTAMPTZ AS "lastCreatedAt", 0::INT AS "unreadCount",
               TRUE AS "isConnected",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = v_me AND ub.blocked_id = cwc.other_id) AS "blockedByMe",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = cwc.other_id AND ub.blocked_id = v_me) AS "blockedMe",
               cwc.connected_at AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'conversationId', ar."conversationId", 'updatedAt', ar."updatedAt", 'seq', ar."seq",
        'otherUserId', ar."otherUserId", 'displayName', ar."displayName",
        'avatarUrl', ar."avatarUrl", 'headline', ar."headline", 'role', ar.role,
        'lastMessageId', ar."lastMessageId", 'lastSenderId', ar."lastSenderId",
        'lastContent', ar."lastContent", 'lastMedia', ar."lastMedia",
        'lastCreatedAt', ar."lastCreatedAt", 'unreadCount', ar."unreadCount",
        'isConnected', ar."isConnected", 'blockedByMe', ar."blockedByMe",
        'blockedMe', ar."blockedMe"
    ) ORDER BY ar.sort_key DESC NULLS LAST), '[]'::jsonb) INTO v_items
      FROM (
          SELECT * FROM convo_rows UNION ALL SELECT * FROM placeholder_rows
          ORDER BY sort_key DESC NULLS LAST LIMIT p_limit
      ) ar;

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
