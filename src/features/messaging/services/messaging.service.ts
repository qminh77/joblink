import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { fail, ok, type ActionResult } from "@/lib/action/result"
import type { createClient } from "@/lib/supabase/server"

import {
  findOrCreateDirectConversation,
  markConversationReadById,
  sendConversationMessage,
} from "../data/messaging.repo"
import {
  clearNewMessageNotifications,
  notifyNewMessage,
} from "../lib/new-message-notification"
import type { EnsureConversationResult, SendMessageResult } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

function excerpt(text: string | null, max = 120): string {
  const t = (text ?? "").trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

export function ensureDirectConversation(
  supabase: Supabase,
  targetUserId: number,
): Promise<EnsureConversationResult> {
  return findOrCreateDirectConversation(supabase, targetUserId)
}

export async function sendMessage(
  supabase: Supabase,
  current: CurrentUser,
  input: { conversationId: number; content: string },
): Promise<SendMessageResult> {
  const result = await sendConversationMessage(supabase, input)

  if (result.ok) {
    await notifyNewMessage({
      recipientId: result.recipientId,
      senderId: current.appUser.id,
      conversationId: input.conversationId,
      senderName: current.profile.displayName,
      senderAvatarUrl: current.profile.avatarUrl,
      excerpt: excerpt(result.message.content),
    })
  }

  return result
}

export async function markConversationRead(
  supabase: Supabase,
  current: CurrentUser,
  conversationId: number,
): Promise<ActionResult> {
  const { error } = await markConversationReadById(supabase, conversationId)
  if (error) {
    console.error("[markConversationRead]", error)
    return fail("unknown")
  }

  await clearNewMessageNotifications({
    recipientId: current.appUser.id,
    conversationId,
  })

  return ok(undefined)
}
