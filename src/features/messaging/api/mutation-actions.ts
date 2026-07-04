"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { fail, type ActionResult } from "@/lib/action/result"
import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"

import {
  createConversationIdSchema,
  createSendMessageSchema,
  createTargetUserIdSchema,
} from "../schemas"
import {
  ensureDirectConversation,
  markConversationRead,
  sendMessage,
} from "../services/messaging.service"
import type { EnsureConversationResult, SendMessageResult } from "../types"

export async function ensureConversationWithAction(
  targetUserId: number,
): Promise<EnsureConversationResult> {
  const te = await getTranslations("messages.errors")
  const parsed = createTargetUserIdSchema(te).safeParse(targetUserId)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? te("invalidUser"),
    }
  }

  await requireCurrentUser()
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

  const current = await requireCurrentUser()
  await checkRateLimit(current.appUser.id, "message", 30, 60)
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

  const current = await requireCurrentUser()
  const supabase = await createClient()
  const result = await markConversationRead(supabase, current, parsed.data)

  if (result.ok) revalidatePath("/", "layout")
  return result
}
