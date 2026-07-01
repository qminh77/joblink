"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { fail, type ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"

import {
  createConversationIdSchema,
  createSendMessageSchema,
  createTargetUserIdSchema,
} from "../schemas"
import type {
  ConversationMessagesPage,
  EnsureConversationResult,
  MessagingOverview,
  SendMessageResult,
} from "../types"
import {
  ensureDirectConversation,
  markConversationRead,
  sendMessage,
} from "../services/messaging.service"
import {
  loadConversationMessages,
  loadMessagingOverview,
  loadUnreadConversationsCount,
} from "./queries"

// ── Reads (RLS lo lọc participant) ───────────────────────────────────────────

export async function getMessagingOverviewAction(): Promise<MessagingOverview> {
  await requirePermission("messages.view")
  return loadMessagingOverview()
}

export async function getUnreadConversationsCountAction(): Promise<number> {
  await requirePermission("messages.view")
  return loadUnreadConversationsCount()
}

export async function getConversationMessagesAction(
  conversationId: number,
  cursor?: { beforeCreatedAt: string; beforeId: number },
): Promise<ConversationMessagesPage> {
  await requirePermission("messages.view")
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

  await requirePermission("messages.send")
  const supabase = await createClient()

  return ensureDirectConversation(supabase, parsed.data)
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

  const current = await requirePermission("messages.send")
  await checkRateLimit(current.appUser.id, "message", 30, 60) // 30 messages / 60s
  const supabase = await createClient()

  const result = await sendMessage(supabase, current, parsed.data)

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "messaging.send",
      entityType: "messages",
      entityId: parsed.data.conversationId,
      newData: { recipientId: result.recipientId },
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

  const current = await requirePermission("messages.view")
  const supabase = await createClient()
  const result = await markConversationRead(supabase, current, parsed.data)

  // Badge global ở navbar đọc qua react-query (client invalidate); vẫn revalidate
  // layout phòng SSR-hydrated.
  if (result.ok) revalidatePath("/", "layout")
  return result
}
