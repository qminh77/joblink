"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { rpcResult } from "@/lib/action/rpc"
import { ok, fail, type ActionResult } from "@/lib/action/result"

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

function excerpt(text: string | null, max = 120): string {
  const t = (text ?? "").trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

// ── Reads (RLS lo lọc participant) ───────────────────────────────────────────

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

// ── Writes (qua RPC SECURITY DEFINER; error code do client whitelist-translate) ─

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

  return rpcResult<{ conversationId: number }>(
    supabase.rpc("find_or_create_direct_conversation", {
      p_other_user_id: parsed.data,
    }),
  )
}

export async function sendMessageAction(
  conversationId: number,
  content: string,
): Promise<SendMessageResult> {
  const te = await getTranslations("messages.errors")
  const parsed = createSendMessageSchema(te).safeParse({ conversationId, content })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ message: MessageItem; recipientId: number }>(
    supabase.rpc("send_message", {
      p_conversation_id: parsed.data.conversationId,
      p_content: parsed.data.content,
    }),
  )

  if (result.ok) {
    // Notify new_message (gộp nếu đã có row chưa đọc cho cùng convo).
    await notifyNewMessage({
      recipientId: result.recipientId,
      senderId: current.appUser.id,
      conversationId: parsed.data.conversationId,
      senderName: current.profile.displayName,
      senderAvatarUrl: current.profile.avatarUrl,
      excerpt: excerpt(result.message.content),
    })
  }
  return result
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
  if (error) {
    console.error("[markConversationReadAction]", error)
    return fail("unknown")
  }

  // Dọn notification new_message chưa đọc của convo này (giảm spam dropdown).
  await clearNewMessageNotifications({
    recipientId: current.appUser.id,
    conversationId: parsed.data,
  })

  // Badge global ở navbar đọc qua react-query (client invalidate); vẫn revalidate
  // layout phòng SSR-hydrated.
  revalidatePath("/", "layout")
  return ok(undefined)
}
