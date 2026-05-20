import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json, NotificationType } from "@/types/database"

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
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type,
    payload: payload as unknown as Json,
  })
  if (error) {
    console.error("[notifications] failed to create", { type, userId, error })
  }
}
