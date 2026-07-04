"use server"

// SRS UC Trace - M07 Tin nhan:
// UC-50 Mo/tao hoi thoai truc tiep; UC-51 Gui tin nhan; UC-52 Xem tin nhan va danh dau da doc.
// Flow: /messages|message dock/dropdown -> messaging action facade -> read/mutation actions -> messaging services/repos/RPC + realtime.

import {
  getConversationMessagesAction as getConversationMessages,
  getMessagingOverviewAction as getMessagingOverview,
  getUnreadConversationsCountAction as getUnreadConversationsCount,
} from "./read-actions"
import {
  ensureConversationWithAction as ensureConversationWith,
  markConversationReadAction as markConversationRead,
  sendMessageAction as sendMessage,
} from "./mutation-actions"

export async function getMessagingOverviewAction(
  limit?: Parameters<typeof getMessagingOverview>[0],
) {
  return getMessagingOverview(limit)
}

export async function getUnreadConversationsCountAction() {
  return getUnreadConversationsCount()
}

export async function getConversationMessagesAction(
  conversationId: Parameters<typeof getConversationMessages>[0],
  cursor?: Parameters<typeof getConversationMessages>[1],
) {
  return getConversationMessages(conversationId, cursor)
}

export async function ensureConversationWithAction(
  targetUserId: Parameters<typeof ensureConversationWith>[0],
) {
  return ensureConversationWith(targetUserId)
}

export async function sendMessageAction(
  conversationId: Parameters<typeof sendMessage>[0],
  content: Parameters<typeof sendMessage>[1],
) {
  return sendMessage(conversationId, content)
}

export async function markConversationReadAction(
  conversationId: Parameters<typeof markConversationRead>[0],
) {
  return markConversationRead(conversationId)
}
