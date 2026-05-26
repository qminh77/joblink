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
  ConversationItem,
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
// các conversation tôi là participant được stream.
//
// Khi có INSERT:
//   • Cập nhật DIRECT vào cache messages (append nếu thiếu) → không refetch.
//   • Cập nhật DIRECT vào overview cache (last_*, unreadCount, bump lên top).
//   • Cập nhật unread badge cache (+1 chỉ khi convo chưa có tin chưa đọc).
//   • Toast nếu không phải convo đang mở và tab visible.
//
// Khi có UPDATE messages (read_at đổi) → patch readAt cho tin đã gửi để tick
// "đã xem" cập nhật tức thời.
//
// Khi conversation_participants UPDATE (last_read_at của tôi đổi ở tab khác)
// → invalidate overview/unread để đồng bộ giữa các tab.
// ---------------------------------------------------------------------------
type RealtimeOptions = {
  currentUserId: number | null
  showToast?: boolean
}

type RealtimeMessageRow = {
  id: number
  conversation_id: number
  sender_id: number
  content: string | null
  media: unknown
  read_at: string | null
  created_at: string
}

function rowToMessage(row: RealtimeMessageRow): MessageItem {
  return {
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    media: (row.media as MessageItem["media"]) ?? null,
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

function applyMessageInsert(
  qc: QueryClient,
  row: RealtimeMessageRow,
  currentUserId: number,
) {
  const convId = row.conversation_id
  const msg = rowToMessage(row)
  const key = MESSAGING_MESSAGES_KEY(convId)

  // 1) Append vào messages cache nếu đang được mở/có sẵn (dedup theo id).
  const existing = qc.getQueryData<ConversationMessagesPage>(key)
  if (existing) {
    if (!existing.items.some((m) => m.id === msg.id)) {
      qc.setQueryData<ConversationMessagesPage>(key, {
        ...existing,
        items: [...existing.items, msg],
      })
    }
  }

  // 2) Patch overview in-place.
  const fromMe = row.sender_id === currentUserId
  const isActive = isConversationActive(convId)
  const overview = qc.getQueryData<MessagingOverview>(MESSAGING_OVERVIEW_KEY)
  if (overview) {
    const idx = overview.items.findIndex((c) => c.conversationId === convId)
    if (idx >= 0) {
      const current = overview.items[idx]
      const prevUnread = current.unreadCount
      // Nếu là tin của người khác và user không đang mở chat → tăng unread.
      const nextUnread =
        fromMe || isActive ? prevUnread : prevUnread + 1
      const updated: ConversationItem = {
        ...current,
        lastMessageId: msg.id,
        lastSenderId: msg.senderId,
        lastContent: msg.content,
        lastMedia: msg.media,
        lastCreatedAt: msg.createdAt,
        updatedAt: msg.createdAt,
        unreadCount: nextUnread,
      }
      const rest = overview.items.filter((_, i) => i !== idx)
      const becameUnread = prevUnread === 0 && nextUnread > 0
      qc.setQueryData<MessagingOverview>(MESSAGING_OVERVIEW_KEY, {
        items: [updated, ...rest],
        unreadConversations: becameUnread
          ? overview.unreadConversations + 1
          : overview.unreadConversations,
      })

      // 3) Badge global: chỉ +1 khi convo trước đó đã đọc hết và tin từ
      //    người khác và user không đang xem chat đó.
      if (becameUnread && !fromMe && !isActive) {
        const prevCount = qc.getQueryData<number>(MESSAGING_UNREAD_KEY) ?? 0
        qc.setQueryData<number>(MESSAGING_UNREAD_KEY, prevCount + 1)
      }
    } else {
      // Conversation chưa có trong overview (vd tạo mới) → invalidate fetch.
      qc.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
      qc.invalidateQueries({ queryKey: MESSAGING_UNREAD_KEY })
    }
  } else {
    qc.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
    qc.invalidateQueries({ queryKey: MESSAGING_UNREAD_KEY })
  }
}

function applyMessageUpdate(qc: QueryClient, row: RealtimeMessageRow) {
  // Chỉ quan tâm read_at đổi → cập nhật tick "đã xem" cho tin của me trong
  // panel đang mở. Không invalidate gì khác để tránh refetch.
  const key = MESSAGING_MESSAGES_KEY(row.conversation_id)
  const existing = qc.getQueryData<ConversationMessagesPage>(key)
  if (!existing) return
  let changed = false
  const next = existing.items.map((m) => {
    if (m.id !== row.id) return m
    if (m.readAt === row.read_at) return m
    changed = true
    return { ...m, readAt: row.read_at }
  })
  if (changed) {
    qc.setQueryData<ConversationMessagesPage>(key, { ...existing, items: next })
  }
}

export function useRealtimeMessaging({
  currentUserId,
  showToast = true,
}: RealtimeOptions) {
  const qc = useQueryClient()

  const handleInsert = useCallback(
    (row: RealtimeMessageRow) => {
      if (!currentUserId) return
      applyMessageInsert(qc, row, currentUserId)

      const fromMe = row.sender_id === currentUserId
      if (fromMe) return
      if (isConversationActive(row.conversation_id)) return

      if (showToast && isDocumentVisible()) {
        const overview = qc.getQueryData<MessagingOverview>(
          MESSAGING_OVERVIEW_KEY,
        )
        const conv = overview?.items.find(
          (c) => c.conversationId === row.conversation_id,
        )
        const name = conv?.displayName ?? "Tin nhắn mới"
        const text = (row.content ?? "").trim()
        const preview = text.length > 80 ? `${text.slice(0, 79)}…` : text
        toast.message(name, { description: preview })
      }
    },
    [qc, currentUserId, showToast],
  )

  const handleUpdate = useCallback(
    (row: RealtimeMessageRow) => applyMessageUpdate(qc, row),
    [qc],
  )

  useEffect(() => {
    if (!currentUserId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`messaging-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => handleInsert(payload.new as RealtimeMessageRow),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => handleUpdate(payload.new as RealtimeMessageRow),
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
  }, [currentUserId, qc, handleInsert, handleUpdate])
}
