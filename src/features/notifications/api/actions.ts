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
