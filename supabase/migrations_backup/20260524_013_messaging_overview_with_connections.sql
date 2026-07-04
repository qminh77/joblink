-- =============================================================================
-- JOBLINK MIGRATION 20260524_013 — MESSAGING OVERVIEW v2 (kèm connections)
-- =============================================================================
-- Đổi `get_messaging_overview` để trả về:
--   • Tất cả conversation đã tồn tại của user (như cũ).
--   • + connections accepted CHƯA có conversation nào (placeholder, để user
--     bấm vào là tự tạo). conversationId = NULL trên các entry này.
--
-- UX: vào /messages thấy ngay tất cả người mình có thể nhắn tin → bấm là chat,
-- không cần đi qua trang Network để bấm Message rồi mới hiện trong list.
--
-- Lưu ý: KHÔNG đổi shape của items, chỉ cho `conversationId` nullable. Client
-- đã có MessageButton → ensureConversationWithAction(otherUserId) — chỉ cần
-- gọi đúng action khi user bấm vào placeholder.
-- =============================================================================

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
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0);
    END IF;

    -- 1) Conversations đã tồn tại của tôi
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
    convo_rows AS (
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
            TRUE                              AS "isConnected",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = v_me AND ub.blocked_id = op.other_user_id
            )                                 AS "blockedByMe",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = op.other_user_id AND ub.blocked_id = v_me
            )                                 AS "blockedMe",
            COALESCE(lm.last_created_at, c.updated_at) AS sort_key
          FROM other_part op
          JOIN public.conversations c   ON c.id = op.conversation_id
          JOIN public.users u           ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
          LEFT JOIN last_msg lm ON lm.conversation_id = op.conversation_id
          LEFT JOIN unread   unr ON unr.conversation_id = op.conversation_id
    ),
    -- 2) Connections accepted không nằm trong conversation nào
    my_connections AS (
        SELECT CASE WHEN cn.requester_id = v_me THEN cn.receiver_id
                    ELSE cn.requester_id END AS other_id,
               COALESCE(cn.responded_at, cn.requested_at) AS connected_at
          FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND (cn.requester_id = v_me OR cn.receiver_id = v_me)
    ),
    connections_without_convo AS (
        SELECT mc.other_id, mc.connected_at
          FROM my_connections mc
         WHERE mc.other_id NOT IN (SELECT "otherUserId" FROM convo_rows)
    ),
    placeholder_rows AS (
        SELECT
            NULL::BIGINT                      AS "conversationId",
            cwc.connected_at                  AS "updatedAt",
            cwc.other_id                      AS "otherUserId",
            COALESCE(mp.full_name, cp.name)   AS "displayName",
            COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
            COALESCE(mp.headline, cp.industry)   AS "headline",
            u.role                            AS role,
            NULL::BIGINT                      AS "lastMessageId",
            NULL::BIGINT                      AS "lastSenderId",
            NULL::TEXT                        AS "lastContent",
            NULL::JSONB                       AS "lastMedia",
            NULL::TIMESTAMPTZ                 AS "lastCreatedAt",
            0::INT                            AS "unreadCount",
            TRUE                              AS "isConnected",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = v_me AND ub.blocked_id = cwc.other_id
            )                                 AS "blockedByMe",
            EXISTS (
                SELECT 1 FROM public.user_blocks ub
                 WHERE ub.blocker_id = cwc.other_id AND ub.blocked_id = v_me
            )                                 AS "blockedMe",
            cwc.connected_at                  AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
    ),
    -- 3) Gộp + sort
    all_rows AS (
        SELECT * FROM convo_rows
        UNION ALL
        SELECT * FROM placeholder_rows
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'conversationId',  ar."conversationId",
            'updatedAt',       ar."updatedAt",
            'otherUserId',     ar."otherUserId",
            'displayName',     ar."displayName",
            'avatarUrl',       ar."avatarUrl",
            'headline',        ar."headline",
            'role',            ar.role,
            'lastMessageId',   ar."lastMessageId",
            'lastSenderId',    ar."lastSenderId",
            'lastContent',     ar."lastContent",
            'lastMedia',       ar."lastMedia",
            'lastCreatedAt',   ar."lastCreatedAt",
            'unreadCount',     ar."unreadCount",
            'isConnected',     ar."isConnected",
            'blockedByMe',     ar."blockedByMe",
            'blockedMe',       ar."blockedMe"
        )
        ORDER BY ar.sort_key DESC NULLS LAST
    ), '[]'::jsonb)
      INTO v_items
      FROM (
          SELECT * FROM all_rows
           ORDER BY sort_key DESC NULLS LAST
           LIMIT p_limit
      ) ar;

    RETURN jsonb_build_object(
        'items', v_items,
        'unreadConversations', COALESCE((
            SELECT COUNT(*)::INT FROM jsonb_array_elements(v_items) e
             WHERE (e->>'unreadCount')::INT > 0
        ), 0)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_overview(INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260524_013
-- =============================================================================
