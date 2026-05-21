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

/**
 * Xoá notification liên quan tới một connection (vd: sender huỷ lời mời thì
 * thông báo "X muốn kết nối" ở receiver trở thành rác — dọn luôn).
 */
export async function deleteConnectionNotifications(input: {
  connectionId: number
  types?: NotificationType[]
}): Promise<void> {
  const admin = createAdminClient()
  let query = admin
    .from("notifications")
    .delete()
    .eq("payload->>connectionId", String(input.connectionId))
  if (input.types && input.types.length > 0) {
    query = query.in("type", input.types)
  }
  const { error } = await query
  if (error) {
    console.error("[notifications] failed to delete", {
      connectionId: input.connectionId,
      error,
    })
  }
}
