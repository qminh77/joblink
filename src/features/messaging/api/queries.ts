import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import type {
  ConversationItem,
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"

const OVERVIEW_LIMIT = 50
const MESSAGES_PAGE = 40

const EMPTY_OVERVIEW: MessagingOverview = {
  items: [],
  unreadConversations: 0,
}

const EMPTY_PAGE: ConversationMessagesPage = {
  items: [],
  hasMore: false,
  otherUserId: null,
}

type OverviewRpcResponse = {
  items?: ConversationItem[]
  unreadConversations?: number
} | null

type MessagesRpcResponse = {
  items?: MessageItem[]
  hasMore?: boolean
  otherUserId?: number | null
} | null

export async function loadMessagingOverview(): Promise<MessagingOverview> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_OVERVIEW

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_messaging_overview", {
    p_limit: OVERVIEW_LIMIT,
  })

  if (error) {
    console.error(
      "[loadMessagingOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_OVERVIEW
  }

  const payload = data as unknown as OverviewRpcResponse
  return {
    items: payload?.items ?? [],
    unreadConversations: payload?.unreadConversations ?? 0,
  }
}

export async function loadUnreadConversationsCount(): Promise<number> {
  const current = await getCurrentUser()
  if (!current) return 0

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_unread_conversations_count")

  if (error) {
    console.error(
      "[loadUnreadConversationsCount] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return 0
  }

  return typeof data === "number" ? data : 0
}

export async function loadConversationMessages(
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_PAGE

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_conversation_messages", {
    p_conversation_id: conversationId,
    p_before_created_at: cursor?.beforeCreatedAt ?? null,
    p_before_id: cursor?.beforeId ?? null,
    p_limit: MESSAGES_PAGE,
  })

  if (error) {
    console.error(
      "[loadConversationMessages] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_PAGE
  }

  const payload = data as unknown as MessagesRpcResponse
  return {
    items: payload?.items ?? [],
    hasMore: payload?.hasMore ?? false,
    otherUserId: payload?.otherUserId ?? null,
  }
}
