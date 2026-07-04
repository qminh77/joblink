"use client"

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { NOTIFICATIONS_KEY, UNREAD_KEY } from "@/features/notifications/hooks"
import { createClient } from "@/lib/supabase/client"

import {
  ensureConversationWithAction,
  markConversationReadAction,
  sendMessageAction,
} from "../api/actions"
import { translateMessagingError } from "../lib/translate-error"
import type {
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"
import { MESSAGING_MESSAGES_KEY, MESSAGING_OVERVIEW_KEY } from "./keys"
import { invalidateMessaging } from "./shared"

type SendMessageVars = { conversationId: number; content: string }
type SendMessageData = { message: MessageItem; recipientId: number }

export function useSendMessage(currentUserId: number) {
  const qc = useQueryClient()
  const te = useTranslations("messages.errors")

  return useMutation<SendMessageData, Error, SendMessageVars, {
    snapshot?: ConversationMessagesPage
    tempId: number
  }>({
    mutationFn: async ({ conversationId, content }) => {
      const result = await sendMessageAction(conversationId, content)
      if (!result.ok) throw new Error(result.error)
      return { message: result.message, recipientId: result.recipientId }
    },
    onMutate: async ({ conversationId, content }) => {
      const key = MESSAGING_MESSAGES_KEY(conversationId)
      await qc.cancelQueries({ queryKey: key })
      const snapshot = qc.getQueryData<ConversationMessagesPage>(key)

      const tempId = -Date.now()
      const optimistic: MessageItem = {
        id: tempId,
        senderId: currentUserId,
        content,
        media: null,
        readAt: null,
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<ConversationMessagesPage>(key, (prev) =>
        prev
          ? { ...prev, items: [...prev.items, optimistic] }
          : { items: [optimistic], hasMore: false, otherUserId: null },
      )

      // Broadcast immediately to the conversation channel for 0ms latency
      const supabase = createClient()
      const channel = supabase.channel(`conversation-${conversationId}`)
      channel.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          id: tempId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          media: null,
          read_at: null,
          created_at: optimistic.createdAt,
        },
      })

      return { snapshot, tempId }
    },
    onError: (error, { conversationId }, context) => {
      if (context?.snapshot) {
        qc.setQueryData(MESSAGING_MESSAGES_KEY(conversationId), context.snapshot)
      }
      toast.error(translateMessagingError(te, error.message))
    },
    onSuccess: (data, { conversationId }, context) => {
      const { message, recipientId } = data
      const key = MESSAGING_MESSAGES_KEY(conversationId)
      qc.setQueryData<ConversationMessagesPage>(key, (prev) => {
        if (!prev) return { items: [message], hasMore: false, otherUserId: null }
        const alreadyHasReal = prev.items.some((item) => item.id === message.id)
        if (alreadyHasReal) {
          return {
            ...prev,
            items: prev.items.filter((item) => item.id !== context?.tempId),
          }
        }
        const replaced = prev.items.map((item) =>
          item.id === context?.tempId ? message : item,
        )
        return { ...prev, items: replaced }
      })

      updateSenderOverview(qc, conversationId, currentUserId, message)
    },
    onSettled: () => invalidateMessaging(qc),
  })
}

function updateSenderOverview(
  qc: QueryClient,
  conversationId: number,
  currentUserId: number,
  message: MessageItem,
) {
  qc.setQueriesData<MessagingOverview>(
    { queryKey: MESSAGING_OVERVIEW_KEY },
    (prev) => {
      if (!prev) return prev
      if (!prev.items.some((item) => item.conversationId === conversationId)) {
        return prev
      }

      const items = prev.items.map((item) =>
        item.conversationId === conversationId
          ? {
              ...item,
              lastMessageId: message.id,
              lastSenderId: currentUserId,
              lastContent: message.content || "",
              lastCreatedAt: message.createdAt,
            }
          : item,
      )
      items.sort(
        (a, b) =>
          new Date(b.lastCreatedAt || b.updatedAt).getTime() -
          new Date(a.lastCreatedAt || a.updatedAt).getTime(),
      )

      return { ...prev, items }
    },
  )
}

export function useMarkConversationRead() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (conversationId) => {
      const result = await markConversationReadAction(conversationId)
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      invalidateMessaging(qc)
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useEnsureConversation() {
  const qc = useQueryClient()
  return useMutation<number, Error, number>({
    mutationFn: async (targetUserId) => {
      const result = await ensureConversationWithAction(targetUserId)
      if (!result.ok) throw new Error(result.error)
      return result.conversationId
    },
    onSuccess: (cid, targetUserId) => {
      qc.setQueriesData<Record<string, unknown>>({ queryKey: MESSAGING_OVERVIEW_KEY }, (prev: Record<string, unknown> | undefined) => {
        if (!prev || !Array.isArray(prev.items)) return prev
        return {
          ...prev,
          items: prev.items.map((item: Record<string, unknown>) =>
            item.otherUserId === targetUserId
              ? { ...item, conversationId: cid }
              : item
          ),
        }
      })
      invalidateMessaging(qc)
    }
  })
}
