"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  createConversationIdSchema,
  createSendMessageSchema,
  createTargetUserIdSchema,
} from "../schemas"
import type {
  ConversationMessagesPage,
  EnsureConversationResult,
  MessageItem,
  MessagingOverview,
  SendMessageResult,
} from "../types"
import {
  clearNewMessageNotifications,
  notifyNewMessage,
} from "../lib/new-message-notification"

import {
  loadConversationMessages,
  loadMessagingOverview,
  loadUnreadConversationsCount,
} from "./queries"

type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

function excerpt(text: string | null, max = 120): string {
  const t = (text ?? "").trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

export async function getMessagingOverviewAction(): Promise<MessagingOverview> {
  return loadMessagingOverview()
}

export async function getUnreadConversationsCountAction(): Promise<number> {
  return loadUnreadConversationsCount()
}

export async function getConversationMessagesAction(
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  return loadConversationMessages(conversationId, cursor)
}

export async function ensureConversationWithAction(
  targetUserId: number,
): Promise<EnsureConversationResult> {
  const te = await getTranslations("messages.errors")
  const parsed = createTargetUserIdSchema(te).safeParse(targetUserId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("invalidUser") }
  }

  await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    "find_or_create_direct_conversation",
    { p_other_user_id: parsed.data },
  )

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; conversationId: number }
    | { ok: false; error: string }
    | null

  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) {
    // Trả nguyên code (vd "notConnected") — client translate qua whitelist
    // ở translateMessagingError. Tránh gọi te() ở server với key động.
    return { ok: false, error: payload.error }
  }
  return { ok: true, conversationId: payload.conversationId }
}

export async function sendMessageAction(
  conversationId: number,
  content: string,
): Promise<SendMessageResult> {
  const te = await getTranslations("messages.errors")
  const parsed = createSendMessageSchema(te).safeParse({
    conversationId,
    content,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("send_message", {
    p_conversation_id: parsed.data.conversationId,
    p_content: parsed.data.content,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | {
        ok: true
        message: MessageItem
        recipientId: number
      }
    | { ok: false; error: string }
    | null

  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) {
    // Trả nguyên code (vd "notConnected") — client translate qua whitelist
    // ở translateMessagingError. Tránh gọi te() ở server với key động.
    return { ok: false, error: payload.error }
  }

  // Tạo notification new_message (gộp nếu đã có row chưa đọc cho cùng convo).
  await notifyNewMessage({
    recipientId: payload.recipientId,
    senderId: current.appUser.id,
    conversationId: parsed.data.conversationId,
    senderName: current.profile.displayName,
    senderAvatarUrl: current.profile.avatarUrl,
    excerpt: excerpt(payload.message.content),
  })

  // Không revalidate /messages: client dùng React Query + realtime để cập nhật.
  return {
    ok: true,
    message: payload.message,
    recipientId: payload.recipientId,
  }
}

export async function markConversationReadAction(
  conversationId: number,
): Promise<ActionResult> {
  const te = await getTranslations("messages.errors")
  const parsed = createConversationIdSchema(te).safeParse(conversationId)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidConversation"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: parsed.data,
  })
  if (error) return fail(error.message)

  // Dọn notification new_message chưa đọc của convo này (giảm spam ở dropdown
  // notifications khi user đã mở chat).
  await clearNewMessageNotifications({
    recipientId: current.appUser.id,
    conversationId: parsed.data,
  })

  // Badge global ở navbar đọc qua react-query — invalidate qua client.
  // Nhưng vẫn revalidate notifications layout phòng SSR-hydrated.
  revalidatePath("/", "layout")
  return { ok: true }
}
