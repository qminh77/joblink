import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { NotificationType } from "@/types/database"

import {
  deleteConnectionNotificationRows,
  getNotificationRecipient,
  insertNotificationRow,
} from "../data/notifications.repo"
import { getPreferenceByCategory } from "../data/preferences.repo"
import { CATEGORY_BY_TYPE } from "../lib/preferences"
import { sendNotificationEmail } from "./notification-mailer.service"
import type { NotificationPayload } from "../types"

type CreateNotificationInput = {
  userId: number
  type: NotificationType
  payload: NotificationPayload
}

export async function createNotification({
  userId,
  type,
  payload,
}: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient()
  const category = CATEGORY_BY_TYPE[type]
  const { data: pref } = await getPreferenceByCategory(admin, userId, category)

  if (pref?.in_app_enabled !== false) {
    const { error } = await insertNotificationRow(admin, {
      userId,
      type,
      payload,
    })
    if (error) {
      console.error("[notifications] failed to create", { type, userId, error })
    }
  }

  if (pref?.email_enabled === true) {
    const { data: recipient } = await getNotificationRecipient(admin, userId)
    if (recipient?.email) {
      await sendNotificationEmail({
        to: recipient.email,
        category,
        locale: recipient.locale ?? "vi",
      })
    }
  }
}

export async function deleteConnectionNotifications(input: {
  connectionId: number
  types?: NotificationType[]
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await deleteConnectionNotificationRows(admin, input)
  if (error) {
    console.error("[notifications] failed to delete", {
      connectionId: input.connectionId,
      error,
    })
  }
}
