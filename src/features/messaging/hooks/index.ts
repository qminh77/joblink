"use client"

import { useCallback, useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { NOTIFICATIONS_KEY, UNREAD_KEY } from "@/features/notifications/hooks"

import {
  ensureConversationWithAction,
  getConversationMessagesAction,
  getMessagingOverviewAction,
  getUnreadConversationsCountAction,
  markConversationReadAction,
  sendMessageAction,
} from "../api/actions"
import {
  isConversationActive,
  isDocumentVisible,
  setActiveConversation,
} from "../lib/active-conversation"
import { translateMessagingError } from "../lib/translate-error"
import type {
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"

export const MESSAGING_OVERVIEW_KEY = ["messaging", "overview"] as const
export const MESSAGING_UNREAD_KEY = ["messaging", "unread"] as const
export const MESSAGING_MESSAGES_KEY = (conversationId: number) =>
  ["messaging", "messages", conversationId] as const

// ---------------------------------------------------------------------------
// Overview (left rail)
// ---------------------------------------------------------------------------
export function useMessagingOverview(initialData?: MessagingOverview) {
  return useQuery<MessagingOverview>({
    queryKey: MESSAGING_OVERVIEW_KEY,
    queryFn: getMessagingOverviewAction,
    initialData,
    staleTime: 15_000,
  })
}

// ---------------------------------------------------------------------------
// Badge global unread count
// ---------------------------------------------------------------------------
export function useUnreadConversationsCount(initialData?: number) {
  return useQuery<number>({
    queryKey: MESSAGING_UNREAD_KEY,
    queryFn: getUnreadConversationsCountAction,
    initialData,
    staleTime: 15_000,
  })
}

// ---------------------------------------------------------------------------
// Messages của một conversation
// ---------------------------------------------------------------------------
export function useConversationMessages(
  conversationId: number | null,
  initialData?: ConversationMessagesPage,
) {
  return useQuery<ConversationMessagesPage>({
    queryKey: conversationId
      ? MESSAGING_MESSAGES_KEY(conversationId)
      : ["messaging", "messages", "none"],
    queryFn: async () => {
      if (!conversationId)
        return { items: [], hasMore: false, otherUserId: null }
      return getConversationMessagesAction(conversationId)
    },
    enabled: conversationId != null,
    initialData,
    staleTime: 10_000,
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function invalidateMessaging(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
  qc.invalidateQueries({ queryKey: MESSAGING_UNREAD_KEY })
}

// ---------------------------------------------------------------------------
// Send message — optimistic append vào messages cache + bump overview
// ---------------------------------------------------------------------------
type SendMessageVars = { conversationId: number; content: string }

export function useSendMessage(currentUserId: number) {
  const qc = useQueryClient()
  const te = useTranslations("messages.errors")

  return useMutation<
    MessageItem,
    Error,
    SendMessageVars,
    { snapshot?: ConversationMessagesPage; tempId: number }
  >({
    mutationFn: async ({ conversationId, content }) => {
      const result = await sendMessageAction(conversationId, content)
      if (!result.ok) throw new Error(result.error)
      return result.message
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
    onSuccess: (message, { conversationId }, context) => {
      const key = MESSAGING_MESSAGES_KEY(conversationId)
      qc.setQueryData<ConversationMessagesPage>(key, (prev) => {
        if (!prev) return { items: [message], hasMore: false, otherUserId: null }
        const replaced = prev.items.map((m) =>
          m.id === context?.tempId ? message : m,
        )
        return { ...prev, items: replaced }
      })
    },
    onSettled: () => invalidateMessaging(qc),
  })
}

// ---------------------------------------------------------------------------
// Mark conversation read
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Ensure conversation (mở chat từ profile)
// ---------------------------------------------------------------------------
export function useEnsureConversation() {
  return useMutation<number, Error, number>({
    mutationFn: async (targetUserId) => {
      const result = await ensureConversationWithAction(targetUserId)
      if (!result.ok) throw new Error(result.error)
      return result.conversationId
    },
  })
}

// ---------------------------------------------------------------------------
// Active conversation sync — gắn vào component chat panel
// ---------------------------------------------------------------------------
export function useActiveConversation(conversationId: number | null) {
  useEffect(() => {
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId])
}

// ---------------------------------------------------------------------------
// Realtime — subscribe tới messages của tôi. RLS đảm bảo chỉ messages trong
// các conversation tôi là participant được stream. Khi có INSERT:
//   • Nếu là convo đang mở: invalidate messages key (panel sẽ refetch),
//     không bật toast, không tăng "có tin mới" UI.
//   • Nếu không: invalidate overview + unread + bật toast (trừ khi tab ẩn).
// Cũng subscribe conversation_participants UPDATE để các tab khác cùng user
// thấy badge giảm khi mở chat ở tab này.
// ---------------------------------------------------------------------------
type RealtimeOptions = {
  currentUserId: number | null
  showToast?: boolean
}

export function useRealtimeMessaging({
  currentUserId,
  showToast = true,
}: RealtimeOptions) {
  const qc = useQueryClient()

  const handleInsert = useCallback(
    (row: { conversation_id: number; sender_id: number; content: string | null }) => {
      const convId = row.conversation_id
      const fromMe = row.sender_id === currentUserId

      // Cache cập nhật: bao giờ cũng invalidate overview/unread.
      invalidateMessaging(qc)
      qc.invalidateQueries({ queryKey: MESSAGING_MESSAGES_KEY(convId) })

      if (fromMe) return
      if (isConversationActive(convId)) return // user đang mở, không bật toast

      if (showToast && isDocumentVisible()) {
        const overview = qc.getQueryData<MessagingOverview>(
          MESSAGING_OVERVIEW_KEY,
        )
        const conv = overview?.items.find((c) => c.conversationId === convId)
        const name = conv?.displayName ?? "Tin nhắn mới"
        const text = (row.content ?? "").trim()
        const preview = text.length > 80 ? `${text.slice(0, 79)}…` : text
        toast.message(name, { description: preview })
      }
    },
    [qc, currentUserId, showToast],
  )

  useEffect(() => {
    if (!currentUserId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`messaging-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as {
            conversation_id: number
            sender_id: number
            content: string | null
          }
          handleInsert(row)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => invalidateMessaging(qc),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, qc, handleInsert])
}
