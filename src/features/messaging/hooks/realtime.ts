"use client"

import { useCallback, useEffect } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  isConversationActive,
  isDocumentVisible,
} from "../lib/active-conversation"
import type {
  ConversationItem,
  ConversationMessagesPage,
  MessageItem,
  MessagingOverview,
} from "../types"
import {
  MESSAGING_MESSAGES_KEY,
  MESSAGING_OVERVIEW_KEY,
  MESSAGING_UNREAD_KEY,
} from "./keys"
import { invalidateMessaging } from "./shared"

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
  const convId = Number(row.conversation_id)
  row.id = Number(row.id)
  row.conversation_id = convId
  row.sender_id = Number(row.sender_id)
  const message = rowToMessage(row)
  const key = MESSAGING_MESSAGES_KEY(convId)

  const existing = qc.getQueryData<ConversationMessagesPage>(key)
  if (existing && !existing.items.some((item) => item.id === message.id)) {
    const hasOptimistic = existing.items.some(
      (item) => item.id < 0 && item.senderId === message.senderId && item.content === message.content
    )
    if (!hasOptimistic) {
      qc.setQueryData<ConversationMessagesPage>(key, {
        ...existing,
        items: [...existing.items, message],
      })
    }
  }

  const fromMe = row.sender_id === currentUserId
  const isActive = isConversationActive(convId)
  const overview = qc.getQueryData<MessagingOverview>(MESSAGING_OVERVIEW_KEY)
  if (overview) {
    const idx = overview.items.findIndex(
      (item) => item.conversationId === convId,
    )
    if (idx >= 0) {
      const current = overview.items[idx]
      const prevUnread = current.unreadCount
      const nextUnread = fromMe || isActive ? prevUnread : prevUnread + 1
      const updated: ConversationItem = {
        ...current,
        lastMessageId: message.id,
        lastSenderId: message.senderId,
        lastContent: message.content,
        lastMedia: message.media,
        lastCreatedAt: message.createdAt,
        updatedAt: message.createdAt,
        unreadCount: nextUnread,
      }
      const rest = overview.items.filter((_, itemIndex) => itemIndex !== idx)
      const becameUnread = prevUnread === 0 && nextUnread > 0
      qc.setQueryData<MessagingOverview>(MESSAGING_OVERVIEW_KEY, {
        items: [updated, ...rest],
        unreadConversations: becameUnread
          ? overview.unreadConversations + 1
          : overview.unreadConversations,
      })

      if (becameUnread && !fromMe && !isActive) {
        const prevCount = qc.getQueryData<number>(MESSAGING_UNREAD_KEY) ?? 0
        qc.setQueryData<number>(MESSAGING_UNREAD_KEY, prevCount + 1)
      }
    } else {
      invalidateMessaging(qc)
    }
  } else {
    invalidateMessaging(qc)
  }
}

function applyMessageUpdate(qc: QueryClient, row: RealtimeMessageRow) {
  const convId = Number(row.conversation_id)
  row.id = Number(row.id)
  const key = MESSAGING_MESSAGES_KEY(convId)
  const existing = qc.getQueryData<ConversationMessagesPage>(key)
  if (!existing) return

  let changed = false
  const next = existing.items.map((item) => {
    if (item.id !== row.id) return item
    if (item.readAt === row.read_at) return item
    changed = true
    return { ...item, readAt: row.read_at }
  })

  if (changed) {
    qc.setQueryData<ConversationMessagesPage>(key, {
      ...existing,
      items: next,
    })
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
        const conversation = overview?.items.find(
          (item) => item.conversationId === row.conversation_id,
        )
        const name = conversation?.displayName ?? "Tin nhắn mới"
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
