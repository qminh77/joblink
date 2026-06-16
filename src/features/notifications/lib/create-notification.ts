import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json, NotificationType } from "@/types/database"

import type { NotificationPayload } from "../types"
import { CATEGORY_BY_TYPE } from "./preferences"

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

  // UC-65: tôn trọng tùy chỉnh của người NHẬN. Nếu họ đã tắt kênh trong-ứng-dụng
  // cho nhóm tương ứng thì không tạo notification (không có dòng = mặc định bật).
  const category = CATEGORY_BY_TYPE[type]
  const { data: pref } = await admin
    .from("notification_preferences")
    .select("in_app_enabled")
    .eq("user_id", userId)
    .eq("type", category)
    .maybeSingle<{ in_app_enabled: boolean }>()
  if (pref && pref.in_app_enabled === false) return

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
