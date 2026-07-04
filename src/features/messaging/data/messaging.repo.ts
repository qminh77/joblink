import "server-only"

import { rpcResult } from "@/lib/action/rpc"
import type { createClient } from "@/lib/supabase/server"

import type { MessageItem } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

export function findOrCreateDirectConversation(
  supabase: Supabase,
  targetUserId: number,
) {
  return rpcResult<{ conversationId: number }>(
    supabase.rpc("find_or_create_direct_conversation", {
      p_other_user_id: targetUserId,
    }),
  )
}

export function sendConversationMessage(
  supabase: Supabase,
  input: { conversationId: number; content: string },
) {
  return rpcResult<{ message: MessageItem; recipientId: number }>(
    supabase.rpc("send_message", {
      p_conversation_id: input.conversationId,
      p_content: input.content,
    }),
  )
}

export function markConversationReadById(
  supabase: Supabase,
  conversationId: number,
) {
  return supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  })
}

export function fetchMessagingOverviewRpc(supabase: Supabase, limit: number) {
  return supabase.rpc("get_messaging_overview", { p_limit: limit })
}

export function fetchUnreadConversationsCountRpc(supabase: Supabase) {
  return supabase.rpc("get_unread_conversations_count")
}

export function fetchConversationMessagesRpc(
  supabase: Supabase,
  input: {
    conversationId: number
    beforeCreatedAt?: string | null
    beforeId?: number | null
    limit: number
  },
) {
  return supabase.rpc("get_conversation_messages", {
    p_conversation_id: input.conversationId,
    p_before_created_at: input.beforeCreatedAt ?? null,
    p_before_id: input.beforeId ?? null,
    p_limit: input.limit,
  })
}
