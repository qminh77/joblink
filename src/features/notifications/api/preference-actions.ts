"use server"

import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import {
  loadNotificationPreferences,
  saveNotificationPreference,
} from "../services/notification-preferences.service"
import { revalidateNotificationSettings } from "../services/notification-revalidation.service"
import {
  updateNotificationPreferenceSchema,
  type UpdateNotificationPreferenceInput,
} from "../schemas"
import type { NotificationPreferenceMap } from "../lib/preferences"

export async function getNotificationPreferencesAction(): Promise<NotificationPreferenceMap> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  return loadNotificationPreferences(supabase, current.appUser.id)
}

export async function updateNotificationPreferenceAction(
  input: UpdateNotificationPreferenceInput,
): Promise<ActionResult> {
  return action("notifications.errors", async () => {
    const data = parse(updateNotificationPreferenceSchema, input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await saveNotificationPreference(supabase, current.appUser.id, data)
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
    revalidateNotificationSettings()
  })
}
