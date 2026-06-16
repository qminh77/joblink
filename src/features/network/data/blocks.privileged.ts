import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import type { BlockedUserItem } from "../types"

// ⚠️ RANH GIỚI ĐẶC QUYỀN ⚠️
// RLS user_blocks_select_own chỉ cho current user đọc block do CHÍNH MÌNH tạo, và
// member_profiles chỉ đọc được hồ sơ public. Hai nhu cầu dưới đây cần bỏ qua RLS
// một cách CÓ CHỦ ĐÍCH, luôn scope theo `me` đã xác thực ở action:
//   • isBlockedEitherDirection: chặn gửi lời mời khi BẤT KỲ bên nào đã chặn bên kia
//     (chiều "họ chặn tôi" bị RLS che nên không thể kiểm bằng client thường).
//   • listBlockedUsers: hiển thị tên/avatar người bị chặn dù hồ sơ của họ private.
// Mọi nhu cầu service-role của network gói gọn trong file này để dễ audit.

export async function isBlockedEitherDirection(
  a: number,
  b: number,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("user_blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${a},blocked_id.eq.${b}),` +
        `and(blocker_id.eq.${b},blocked_id.eq.${a})`,
    )
    .limit(1)
    .maybeSingle<{ id: number }>()
  return data != null
}

export async function listBlockedUsers(me: number): Promise<BlockedUserItem[]> {
  const admin = createAdminClient()
  const { data: blocks } = await admin
    .from("user_blocks")
    .select("id, blocked_id, created_at")
    .eq("blocker_id", me)
    .order("created_at", { ascending: false })

  const rows = blocks ?? []
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.blocked_id)

  // Người bị chặn có thể là member hoặc company → tra cả hai bảng hồ sơ rồi gộp.
  const [{ data: members }, { data: companies }] = await Promise.all([
    admin
      .from("member_profiles")
      .select("user_id, full_name, avatar_url, headline")
      .in("user_id", ids),
    admin
      .from("company_profiles")
      .select("user_id, name, logo_url, industry")
      .in("user_id", ids),
  ])

  const memberMap = new Map((members ?? []).map((m) => [m.user_id, m]))
  const companyMap = new Map((companies ?? []).map((c) => [c.user_id, c]))

  return rows.map((row) => {
    const member = memberMap.get(row.blocked_id)
    const company = companyMap.get(row.blocked_id)
    return {
      blockId: row.id,
      userId: row.blocked_id,
      blockedAt: row.created_at,
      displayName: member?.full_name ?? company?.name ?? `#${row.blocked_id}`,
      avatarUrl: member?.avatar_url ?? company?.logo_url ?? null,
      headline: member?.headline ?? company?.industry ?? null,
    }
  })
}
