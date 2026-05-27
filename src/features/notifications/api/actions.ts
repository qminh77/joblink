"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { ActionError, action, assertOk } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"

import { loadNotifications, loadUnreadCount } from "./queries"
import {
  markAllNotificationsRead,
  markNotificationRead,
  verifyNotificationTarget,
} from "../data/notifications.repo"
import type { NotificationItem } from "../types"

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

export async function verifyNotificationTargetAction(
  item: NotificationItem,
): Promise<boolean> {
  await requireCurrentUser()
  const supabase = await createClient()
  return verifyNotificationTarget(supabase, item)
}

export async function markNotificationReadAction(
  notificationId: number,
): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      throw ActionError.key("invalidId")
    }
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await markNotificationRead(supabase, notificationId, current.appUser.id),
      "unexpected",
    )
    revalidateNotifications()
  })
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await markAllNotificationsRead(supabase, current.appUser.id),
      "unexpected",
    )
    revalidateNotifications()
  })
}
