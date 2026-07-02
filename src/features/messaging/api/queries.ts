import "server-only"

// SRS UC Trace - M07 Tin nhan:
// UC-50 Tai tong quan hoi thoai; UC-52 Tai tin nhan va unread count.
// Flow: messages server page/client hook -> messaging query -> messaging RPC -> conversations/messages/participants.

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import type {
  ConversationItem,
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"

const OVERVIEW_LIMIT = 50
const OVERVIEW_MAX_LIMIT = 50
// Mở chat: chỉ load "tin gần nhất" đủ cho 1-2 màn hình → cảm giác mở nhanh.
// Cuộn lên load tiếp qua cursor (p_before_created_at/p_before_id).
const MESSAGES_PAGE = 15

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

function clampOverviewLimit(limit?: number) {
  if (!Number.isFinite(limit)) return OVERVIEW_LIMIT
  return Math.min(
    OVERVIEW_MAX_LIMIT,
    Math.max(1, Math.floor(limit ?? OVERVIEW_LIMIT)),
  )
}

export async function loadMessagingOverview(options?: {
  limit?: number
}): Promise<MessagingOverview> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_OVERVIEW

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_messaging_overview", {
    p_limit: clampOverviewLimit(options?.limit),
  })

  if (error) {
    console.error(
      "[loadMessagingOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_OVERVIEW
  }

  const payload = data as unknown as OverviewRpcResponse
  const rawItems = payload?.items ?? []
  
  // Patch các trường bị thiếu do đợt refactor RPC gần đây trên Supabase
  const patchedItems = rawItems.map(item => ({
    ...item,
    isConnected: item.isConnected ?? true,
    blockedByMe: item.blockedByMe ?? false,
    blockedMe: item.blockedMe ?? false,
  }))

  return {
    items: patchedItems,
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
