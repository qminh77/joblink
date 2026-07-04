"use server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import type { ConversationMessagesPage, MessagingOverview } from "../types"
import {
  loadConversationMessages,
  loadMessagingOverview,
  loadUnreadConversationsCount,
} from "./queries"

export async function getMessagingOverviewAction(
  limit?: number,
): Promise<MessagingOverview> {
  await requireCurrentUser()
  return loadMessagingOverview({ limit })
}

export async function getUnreadConversationsCountAction(): Promise<number> {
  await requireCurrentUser()
  return loadUnreadConversationsCount()
}

export async function getConversationMessagesAction(
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  await requireCurrentUser()
  return loadConversationMessages(conversationId, cursor)
}
