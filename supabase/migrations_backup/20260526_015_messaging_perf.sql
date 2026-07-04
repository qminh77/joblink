-- =============================================================================
-- JOBLINK MIGRATION 20260526_015 — MESSAGING PERF
-- =============================================================================
-- Mục tiêu:
--   • Index hot path còn thiếu cho rate-limit + mark-as-read.
--   • Tối ưu get_unread_conversations_count: thay vì COUNT DISTINCT toàn bộ
--     JOIN, dùng EXISTS-per-participant → giảm rows quét.
--   • get_messaging_overview: gộp user_blocks lookups vào 1 CTE thay vì 2
--     subquery EXISTS per row (giảm planner work khi list dài).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index bổ sung
-- -----------------------------------------------------------------------------
-- Rate-limit window: SELECT COUNT WHERE sender_id = me AND created_at >= now()-1m
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
    ON public.messages(sender_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- mark_conversation_read UPDATE đụng vào "tin chưa đọc của người kia": có
-- (conversation_id, sender_id) sẵn nhưng thêm partial cho read_at IS NULL
-- để rút ngắn scan khi convo lớn.
CREATE INDEX IF NOT EXISTS idx_messages_unread_per_conv
    ON public.messages(conversation_id, sender_id)
    WHERE read_at IS NULL AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: get_unread_conversations_count v2
--    Trước: COUNT(DISTINCT m.conversation_id) JOIN messages (quét toàn bộ
--    messages chưa đọc của user). Sau: EXISTS-per-participant (chạy 1 lookup
--    nhanh cho mỗi conversation user tham gia, dừng ngay khi gặp tin chưa đọc).
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

    SELECT COUNT(*)::INT
      INTO v_count
      FROM public.conversation_participants cp
     WHERE cp.user_id = v_me
       AND EXISTS (
           SELECT 1
             FROM public.messages m
            WHERE m.conversation_id = cp.conversation_id
              AND m.deleted_at IS NULL
              AND m.sender_id <> v_me
              AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
            LIMIT 1
       );

    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_conversations_count() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_messaging_overview v3 — gộp user_blocks CTE.
--    Vẫn trả về items dạng cũ (placeholder + conversation), nhưng dùng 1 CTE
--    `blocks` ánh xạ (other_id → blocked_by_me|blocked_me) thay vì 2 EXISTS
--    subquery per row. Khi list 50 conversation, đỡ ~100 lần lookup user_blocks.
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
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0);
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
         WHERE mc.other_id NOT IN (SELECT other_user_id FROM other_part)
    ),
    -- Gộp danh sách other_id để 1 lần quét user_blocks duy nhất.
    all_others AS (
        SELECT other_user_id AS other_id FROM other_part
        UNION
        SELECT other_id FROM connections_without_convo
    ),
    blocks AS (
        SELECT
            a.other_id,
            COALESCE(bool_or(ub.blocker_id = v_me AND ub.blocked_id = a.other_id), FALSE)
                AS blocked_by_me,
            COALESCE(bool_or(ub.blocker_id = a.other_id AND ub.blocked_id = v_me), FALSE)
                AS blocked_me
          FROM all_others a
          LEFT JOIN public.user_blocks ub
            ON (ub.blocker_id = v_me AND ub.blocked_id = a.other_id)
            OR (ub.blocker_id = a.other_id AND ub.blocked_id = v_me)
         GROUP BY a.other_id
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
            COALESCE(b.blocked_by_me, FALSE)  AS "blockedByMe",
            COALESCE(b.blocked_me, FALSE)     AS "blockedMe",
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
          LEFT JOIN blocks   b   ON b.other_id = op.other_user_id
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
            COALESCE(b.blocked_by_me, FALSE)  AS "blockedByMe",
            COALESCE(b.blocked_me, FALSE)     AS "blockedMe",
            cwc.connected_at                  AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
          LEFT JOIN blocks b ON b.other_id = cwc.other_id
         WHERE u.deleted_at IS NULL
    ),
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
-- END MIGRATION 20260526_015
-- =============================================================================
