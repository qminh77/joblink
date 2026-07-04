import type { UserRole } from "@/features/auth/lib/constants"

/**
 * Đường dẫn hồ sơ công khai theo vai trò.
 * Company → trang public `/company/[id]`; member/admin → `/profile/[id]`.
 */
export function profileHref(userId: number | string, role: UserRole): string {
  return role === "company" ? `/company/${userId}` : `/profile/${userId}`
}
