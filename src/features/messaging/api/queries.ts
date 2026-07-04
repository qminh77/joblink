import "server-only"

// SRS UC Trace - M07 Tin nhan:
// UC-50 Tai tong quan hoi thoai; UC-52 Tai tin nhan va unread count.
// Flow: messages server page/client hook -> query facade -> messaging query service/RPC.

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  EMPTY_CONVERSATION_MESSAGES_PAGE,
  EMPTY_MESSAGING_OVERVIEW,
  getConversationMessages,
  getMessagingOverview,
  getUnreadConversationsCount,
} from "../services/messaging-query.service"
import type { ConversationMessagesPage, MessagingOverview } from "../types"

export async function loadMessagingOverview(options?: {
  limit?: number
}): Promise<MessagingOverview> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_MESSAGING_OVERVIEW

  const supabase = await createClient()
  return getMessagingOverview(supabase, options)
}

export async function loadUnreadConversationsCount(): Promise<number> {
  const current = await getCurrentUser()
  if (!current) return 0

  const supabase = await createClient()
  return getUnreadConversationsCount(supabase)
}

export async function loadConversationMessages(
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_CONVERSATION_MESSAGES_PAGE

  const supabase = await createClient()
  return getConversationMessages(supabase, conversationId, cursor)
}
