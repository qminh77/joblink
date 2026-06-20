import "server-only"

import type { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

import type { NotificationItem } from "../types"

// Data-access cho notifications (RLS client: recipient chỉ thấy/sửa của mình).

type Supabase = Awaited<ReturnType<typeof createClient>>

const now = () => new Date().toISOString()

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

/**
 * Kiểm tra "đích" của một notification còn tồn tại để quyết định có cho click
 * điều hướng hay không (vd bài đã xoá → noti chết). Mỗi loại noti map sang một
 * bảng/điều kiện tồn tại tương ứng.
 */
export async function verifyNotificationTarget(
  supabase: Supabase,
  item: NotificationItem,
): Promise<boolean> {
  const admin = createAdminClient()
  const payload = item.payload

  switch (item.type) {
    case "post_reaction":
    case "post_comment":
    case "post_share":
    case "comment_mention":
    case "poll_vote": {
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
    case "application_status_changed":
    case "interview_scheduled":
    case "interview_response": {
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
