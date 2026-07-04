import type { Json } from "@/types/database"
import type { UserRole } from "@/features/auth/lib/constants"

export type ConversationItem = {
  /** null = chưa có conversation, là entry placeholder cho 1 connection. */
  conversationId: number | null
  updatedAt: string
  seq: number | null
  otherUserId: number
  displayName: string | null
  avatarUrl: string | null
  headline: string | null
  role: UserRole
  lastMessageId: number | null
  lastSenderId: number | null
  lastContent: string | null
  lastMedia: Json | null
  lastCreatedAt: string | null
  unreadCount: number
  isConnected: boolean
  blockedByMe: boolean
  blockedMe: boolean
}

export type MessagingOverview = {
  items: ConversationItem[]
  unreadConversations: number
}

export type MessageItem = {
  id: number
  senderId: number
  content: string | null
  media: Json | null
  readAt: string | null
  createdAt: string
}

export type ConversationMessagesPage = {
  items: MessageItem[]
  hasMore: boolean
  otherUserId: number | null
}

export type SendMessageResult =
  | {
      ok: true
      message: MessageItem
      recipientId: number
    }
  | { ok: false; error: string }

export type EnsureConversationResult =
  | { ok: true; conversationId: number }
  | { ok: false; error: string }
