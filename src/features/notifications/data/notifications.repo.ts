import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { createClient } from "@/lib/supabase/server"
import type { Json, NotificationRow, NotificationType } from "@/types/database"

import type { NotificationItem, NotificationPayload } from "../types"

// Data-access cho notifications (RLS client: recipient chỉ thấy/sửa của mình).

type Supabase = Awaited<ReturnType<typeof createClient>>
type AdminSupabase = ReturnType<typeof createAdminClient>

const now = () => new Date().toISOString()

export type NotificationRecord = Pick<
  NotificationRow,
  "id" | "type" | "payload" | "read_at" | "created_at"
>

export type ListNotificationRowsParams = {
  cursor?: string | null
  limit: number
}

export function listNotificationRows(
  supabase: Supabase,
  userId: number,
  params: ListNotificationRowsParams,
) {
  let query = supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (params.cursor) query = query.lt("created_at", params.cursor)

  return query.limit(params.limit)
}

export function countUnreadNotificationRows(
  supabase: Supabase,
  userId: number,
) {
  return supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null)
}

export function markNotificationRead(
  supabase: Supabase,
  notificationId: number,
  userId: number,
) {
  return supabase
    .from("notifications")
    .update({ read_at: now() })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .is("read_at", null)
}

export function markAllNotificationsRead(supabase: Supabase, userId: number) {
  return supabase
    .from("notifications")
    .update({ read_at: now() })
    .eq("user_id", userId)
    .is("read_at", null)
}

export function insertNotificationRow(
  admin: AdminSupabase,
  input: {
    userId: number
    type: NotificationType
    payload: NotificationPayload
  },
) {
  return admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    payload: input.payload as unknown as Json,
  })
}

export function deleteConnectionNotificationRows(
  admin: AdminSupabase,
  input: {
    connectionId: number
    types?: NotificationType[]
  },
) {
  let query = admin
    .from("notifications")
    .delete()
    .eq("payload->>connectionId", String(input.connectionId))

  if (input.types && input.types.length > 0) {
    query = query.in("type", input.types)
  }

  return query
}

export function getNotificationRecipient(admin: AdminSupabase, userId: number) {
  return admin
    .from("users")
    .select("email, locale")
    .eq("id", userId)
    .maybeSingle<{ email: string; locale: string | null }>()
}

/**
 * Kiểm tra "đích" của một notification còn tồn tại để quyết định có cho click
 * điều hướng hay không (vd bài đã xoá → noti chết). Mỗi loại noti map sang một
 * bảng/điều kiện tồn tại tương ứng.
 */
export async function verifyNotificationTarget(
  supabase: Supabase,
  admin: AdminSupabase,
  item: NotificationItem,
): Promise<boolean> {
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
    case "connection_accepted":
    case "company_followed":
    case "user_followed": {
      // Click → /profile/{actor}; chỉ cần actor user còn tồn tại.
      if (!payload || payload.type !== item.type) return false
      const { data } = await admin
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
    case "new_message": {
      if (!payload || payload.type !== item.type) return false
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", payload.conversationId)
        .maybeSingle()
      return data != null
    }
    case "job_application_received":
    case "application_withdrawn":
    case "application_status_changed": {
      if (!payload || payload.type !== item.type) return false
      const { data } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", payload.jobId)
        .is("deleted_at", null)
        .maybeSingle()
      return data != null
    }
    default:
      return true
  }
}
