import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

type NewMessageNotificationInput = {
  recipientId: number
  senderId: number
  conversationId: number
  senderName: string
  senderAvatarUrl: string | null
  excerpt: string
}

/**
 * In-app notification cho new_message.
 *
 * Chống spam: thay vì insert một row mới mỗi tin, gộp vào row chưa đọc duy
 * nhất cho cùng (recipient, conversation). Recipient mở conversation sẽ
 * mark_conversation_read xoá row này, lần sau có tin mới lại tạo 1 row mới.
 * Như vậy danh sách notifications không bị flood khi hai người chat nhanh.
 *
 * Load nhanh: insert lười qua admin client; lỗi chỉ log (không cản đường gửi).
 */
export async function notifyNewMessage(
  input: NewMessageNotificationInput,
): Promise<void> {
  const admin = createAdminClient()

  const payload = {
    type: "new_message" as const,
    conversationId: input.conversationId,
    userId: input.senderId,
    displayName: input.senderName,
    avatarUrl: input.senderAvatarUrl,
    excerpt: input.excerpt,
  }

  const { data: existing } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", input.recipientId)
    .eq("type", "new_message")
    .eq("payload->>conversationId", String(input.conversationId))
    .is("read_at", null)
    .limit(1)
    .maybeSingle<{ id: number }>()

  if (existing) {
    const { error } = await admin
      .from("notifications")
      .update({
        payload: payload as unknown as Json,
        // bump created_at để row trồi lên đầu list bằng cách touch payload
        // (created_at để nguyên — order sẽ giữ thứ tự tới đầu tiên; nếu cần
        // mới-nhất-lên-đầu, dùng updated_at trên notifications — schema hiện
        // tại chưa có cột đó, nên giữ created_at gốc.)
      })
      .eq("id", existing.id)
    if (error) console.error("[notifyNewMessage] update failed", error)
    return
  }

  const { error } = await admin.from("notifications").insert({
    user_id: input.recipientId,
    type: "new_message",
    payload: payload as unknown as Json,
  })
  if (error) console.error("[notifyNewMessage] insert failed", error)
}

/** Khi recipient mở conversation, dọn các notification new_message chưa đọc. */
export async function clearNewMessageNotifications(input: {
  recipientId: number
  conversationId: number
}): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", input.recipientId)
    .eq("type", "new_message")
    .eq("payload->>conversationId", String(input.conversationId))
    .is("read_at", null)
  if (error) console.error("[clearNewMessageNotifications] failed", error)
}
