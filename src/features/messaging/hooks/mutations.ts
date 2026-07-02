"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { NOTIFICATIONS_KEY, UNREAD_KEY } from "@/features/notifications/hooks"

import { ensureConversationWithAction, markConversationReadAction, sendMessageAction } from "../api/actions"
import { translateMessagingError } from "../lib/translate-error"
import type { ConversationMessagesPage, MessageItem, MessagingOverview } from "../types"
import { MESSAGING_MESSAGES_KEY, MESSAGING_OVERVIEW_KEY } from "./keys"
import { invalidateMessaging } from "./shared"
import { createClient } from "@/lib/supabase/client"

type SendMessageVars = { conversationId: number; content: string }

export function useSendMessage(currentUserId: number) {
  const qc = useQueryClient()
  const te = useTranslations("messages.errors")

  return useMutation<
    { message: MessageItem; recipientId: number },
    Error,
    SendMessageVars,
    { snapshot?: ConversationMessagesPage; tempId: number }
  >({
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

      // Send broadcast to recipient
      const supabase = createClient()
      supabase.channel(`messaging-${recipientId}`).send({
        type: "broadcast",
        event: "new_message",
        payload: {
          id: message.id,
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: message.content,
          media: message.media,
          read_at: message.readAt,
          created_at: message.createdAt,
        },
      }).catch(console.error)

      // Optimistically update overview for sender
      qc.setQueriesData<MessagingOverview>({ queryKey: MESSAGING_OVERVIEW_KEY }, (prev) => {
        if (!prev) return prev
        const existingConvo = prev.items.find(i => i.conversationId === conversationId)
        if (!existingConvo) return prev
        const updatedItems = prev.items.map(i => i.conversationId === conversationId ? {
          ...i,
          lastMessageId: message.id,
          lastSenderId: currentUserId,
          lastContent: message.content || "",
          lastCreatedAt: message.createdAt,
        } : i)
        updatedItems.sort((a, b) => new Date(b.lastCreatedAt || b.updatedAt).getTime() - new Date(a.lastCreatedAt || a.updatedAt).getTime())
        return { ...prev, items: updatedItems }
      })
    },
    onSettled: () => invalidateMessaging(qc),
  })
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
