"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getConversationMessagesAction,
  getMessagingOverviewAction,
  getUnreadConversationsCountAction,
} from "../api/actions"
import type {
  ConversationMessagesPage,
  MessagingOverview,
} from "../types"
import {
  MESSAGING_OVERVIEW_LIMIT_KEY,
  MESSAGING_MESSAGES_KEY,
  MESSAGING_OVERVIEW_KEY,
  MESSAGING_UNREAD_KEY,
} from "./keys"

export function useMessagingOverview(
  initialData?: MessagingOverview,
  options?: {
    enabled?: boolean
    limit?: number
    staleTime?: number
  },
) {
  const limit = options?.limit
  return useQuery<MessagingOverview>({
    queryKey:
      typeof limit === "number"
        ? MESSAGING_OVERVIEW_LIMIT_KEY(limit)
        : MESSAGING_OVERVIEW_KEY,
    queryFn: () => getMessagingOverviewAction(limit),
    enabled: options?.enabled ?? true,
    initialData,
    staleTime: options?.staleTime ?? 15_000,
  })
}

export function useUnreadConversationsCount(initialData?: number) {
  return useQuery<number>({
    queryKey: MESSAGING_UNREAD_KEY,
    queryFn: getUnreadConversationsCountAction,
    initialData,
    staleTime: 15_000,
  })
}

export function useConversationMessages(
  conversationId: number | null,
  initialData?: ConversationMessagesPage,
) {
  return useQuery<ConversationMessagesPage>({
    queryKey: conversationId
      ? MESSAGING_MESSAGES_KEY(conversationId)
      : ["messaging", "messages", "none"],
    queryFn: async () => {
      if (!conversationId) {
        return { items: [], hasMore: false, otherUserId: null }
      }
      return getConversationMessagesAction(conversationId)
    },
    enabled: conversationId != null,
    initialData,
    staleTime: 10_000,
  })
}
