import "server-only"

import type { createClient } from "@/lib/supabase/server"

import {
  fetchConversationMessagesRpc,
  fetchMessagingOverviewRpc,
  fetchUnreadConversationsCountRpc,
} from "../data/messaging.repo"
import type {
  ConversationItem,
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"

const OVERVIEW_LIMIT = 50
const OVERVIEW_MAX_LIMIT = 50
const MESSAGES_PAGE = 10

export const EMPTY_MESSAGING_OVERVIEW: MessagingOverview = {
  items: [],
  unreadConversations: 0,
}

export const EMPTY_CONVERSATION_MESSAGES_PAGE: ConversationMessagesPage = {
  items: [],
  hasMore: false,
  otherUserId: null,
}

type Supabase = Awaited<ReturnType<typeof createClient>>

type OverviewRpcResponse = {
  items?: ConversationItem[]
  unreadConversations?: number
} | null

type MessagesRpcResponse = {
  items?: MessageItem[]
  hasMore?: boolean
  otherUserId?: number | null
} | null

export async function getMessagingOverview(
  supabase: Supabase,
  options?: { limit?: number },
): Promise<MessagingOverview> {
  const { data, error } = await fetchMessagingOverviewRpc(
    supabase,
    clampOverviewLimit(options?.limit),
  )

  if (error) {
    console.error(
      "[getMessagingOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_MESSAGING_OVERVIEW
  }

  const payload = data as unknown as OverviewRpcResponse
  return {
    items: patchConversationItems(payload?.items ?? []),
    unreadConversations: payload?.unreadConversations ?? 0,
  }
}

export async function getUnreadConversationsCount(
  supabase: Supabase,
): Promise<number> {
  const { data, error } = await fetchUnreadConversationsCountRpc(supabase)

  if (error) {
    console.error(
      "[getUnreadConversationsCount] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return 0
  }

  return typeof data === "number" ? data : 0
}

export async function getConversationMessages(
  supabase: Supabase,
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  const { data, error } = await fetchConversationMessagesRpc(supabase, {
    conversationId,
    beforeCreatedAt: cursor?.beforeCreatedAt,
    beforeId: cursor?.beforeId,
    limit: MESSAGES_PAGE,
  })

  if (error) {
    console.error(
      "[getConversationMessages] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_CONVERSATION_MESSAGES_PAGE
  }

  const payload = data as unknown as MessagesRpcResponse
  return {
    items: payload?.items ?? [],
    hasMore: payload?.hasMore ?? false,
    otherUserId: payload?.otherUserId ?? null,
  }
}

function clampOverviewLimit(limit?: number) {
  if (!Number.isFinite(limit)) return OVERVIEW_LIMIT
  return Math.min(
    OVERVIEW_MAX_LIMIT,
    Math.max(1, Math.floor(limit ?? OVERVIEW_LIMIT)),
  )
}

function patchConversationItems(items: ConversationItem[]): ConversationItem[] {
  return items.map((item) => ({
    ...item,
    isConnected: item.isConnected ?? true,
    blockedByMe: item.blockedByMe ?? false,
    blockedMe: item.blockedMe ?? false,
  }))
}
