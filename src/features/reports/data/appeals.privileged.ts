import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ModerationActionType } from "@/types/database"

import type { MyModerationAction } from "../types"

// ⚠️ RANH GIỚI ĐẶC QUYỀN ⚠️
// moderation_actions có RLS admin-only → người dùng thường KHÔNG đọc được hành
// động kiểm duyệt nhắm vào chính mình. Hai hàm dưới dùng service-role để (1)
// liệt kê hành động cấp tài khoản chống lại user và (2) xác minh một hành động
// đúng là nhắm vào user trước khi cho gửi khiếu nại. Luôn scope theo userId.

// Chỉ các hành động cấp tài khoản mang tính xử phạt mới cho khiếu nại.
const APPEALABLE: ModerationActionType[] = ["warn", "suspend", "ban"]

export async function listAccountModerationActions(
  userId: number,
): Promise<Omit<MyModerationAction, "appeal">[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("moderation_actions")
    .select("id, action_type, reason, created_at")
    .eq("target_type", "user")
    .eq("target_id", userId)
    .in("action_type", APPEALABLE)
    .order("created_at", { ascending: false })

  return (data ?? []).map((r) => ({
    id: r.id,
    actionType: r.action_type,
    reason: r.reason,
    createdAt: r.created_at,
  }))
}

export async function isModerationActionAgainstUser(
  actionId: number,
  userId: number,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("moderation_actions")
    .select("id")
    .eq("id", actionId)
    .eq("target_type", "user")
    .eq("target_id", userId)
    .in("action_type", APPEALABLE)
    .maybeSingle<{ id: number }>()
  return data != null
}
