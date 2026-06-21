"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import { ActionError, action, assertOk, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"

import { loadNotifications, loadUnreadCount } from "./queries"
import {
  markAllNotificationsRead,
  markNotificationRead,
  verifyNotificationTarget,
} from "../data/notifications.repo"
import { listPreferences, upsertPreference } from "../data/preferences.repo"
import {
  defaultPreferenceMap,
  type NotificationCategory,
  type NotificationPreferenceMap,
} from "../lib/preferences"
import {
  updateNotificationPreferenceSchema,
  type UpdateNotificationPreferenceInput,
} from "../schemas"
import type { NotificationItem } from "../types"
import { loadMoreNotifications } from "./queries"

function revalidateNotifications() {
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}

export async function getNotificationsAction(): Promise<NotificationItem[]> {
  return loadNotifications()
}

export async function loadMoreNotificationsAction(
  cursor: string,
): Promise<{ items: NotificationItem[]; hasMore: boolean }> {
  return loadMoreNotifications(cursor)
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

// ── Preferences (UC-65) ──────────────────────────────────────────────────────

export async function getNotificationPreferencesAction(): Promise<NotificationPreferenceMap> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { data } = await listPreferences(supabase, current.appUser.id)

  const map = defaultPreferenceMap()
  for (const row of data ?? []) {
    const category = row.type as NotificationCategory
    if (category in map) {
      map[category] = {
        inApp: row.in_app_enabled,
        email: row.email_enabled,
      }
    }
  }
  return map
}

export async function updateNotificationPreferenceAction(
  input: UpdateNotificationPreferenceInput,
): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    const data = parse(updateNotificationPreferenceSchema, input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await upsertPreference(
        supabase,
        current.appUser.id,
        data.category,
        data.inApp,
        data.email,
      ),
      "unexpected",
    )
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "notification.preference_update",
      entityType: "notification_preferences",
      newData: {
        category: data.category,
        inApp: data.inApp,
        email: data.email,
      },
    })
    revalidatePath("/settings")
  })
}
