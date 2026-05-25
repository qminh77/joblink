"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { loadNotifications, loadUnreadCount } from "./queries"
import type { NotificationItem } from "../types"

type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

function revalidateNotifications() {
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}

export async function getNotificationsAction(): Promise<NotificationItem[]> {
  return loadNotifications()
}

export async function verifyNotificationTargetAction(
  item: NotificationItem,
): Promise<boolean> {
  const current = await requireCurrentUser()
  if (!current) return false

  const supabase = await createClient()
  const payload = item.payload

  switch (item.type) {
    case "post_reaction":
    case "post_comment":
    case "post_share":
    case "comment_mention": {
      if (!payload || payload.type !== item.type) return false
      const { data } = await supabase
        .from("posts")
        .select("id")
        .eq("id", payload.postId)
        .is("deleted_at", null)
        .eq("status", "active")
        .maybeSingle()
      return data != null
    }
    case "connection_accepted": {
      if (!payload || payload.type !== item.type) return false
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("id", payload.userId)
        .is("deleted_at", null)
        .maybeSingle()
      return data != null
    }
    case "connection_request": {
      if (!payload || payload.type !== item.type) return false
      const { data } = await supabase
        .from("connections")
        .select("id")
        .eq("id", payload.connectionId)
        .in("status", ["pending", "accepted"])
        .maybeSingle()
      return data != null
    }
    default:
      return true
  }
}

export async function getUnreadCountAction(): Promise<number> {
  return loadUnreadCount()
}

export async function markNotificationReadAction(
  notificationId: number,
): Promise<ActionResult> {
  const te = await getTranslations("notifications.errors")
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return fail(te("invalidId"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", current.appUser.id)
    .is("read_at", null)

  if (error) return fail(error.message)
  revalidateNotifications()
  return { ok: true }
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", current.appUser.id)
    .is("read_at", null)

  if (error) {
    const te = await getTranslations("notifications.errors")
    void te
    return fail(error.message)
  }
  revalidateNotifications()
  return { ok: true }
}
