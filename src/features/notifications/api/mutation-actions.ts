"use server"

import { createClient } from "@/lib/supabase/server"
import { ActionError, action } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import {
  markEveryNotificationRead,
  markOneNotificationRead,
} from "../services/notification-command.service"
import { revalidateNotifications } from "../services/notification-revalidation.service"

export async function markNotificationReadAction(
  notificationId: number,
): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      throw ActionError.key("invalidId")
    }

    const current = await requireCurrentUser()
    const supabase = await createClient()
    await markOneNotificationRead(supabase, current.appUser.id, notificationId)
    revalidateNotifications()
  })
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    await markEveryNotificationRead(supabase, current.appUser.id)
    revalidateNotifications()
  })
}
