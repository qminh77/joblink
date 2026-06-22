import "server-only"

import { redirect } from "next/navigation"

import { USER_ROLES } from "@/lib/constants"
import { getCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import { checkUserPermission, getUserPermissionsByUserId } from "@/lib/rbac"
import type { PermissionName } from "@/lib/rbac"

/**
 * Yêu cầu user phải là admin (backward compat).
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.appUser.role !== USER_ROLES[2]) redirect("/home")
  return user
}

/**
 * Yêu cầu user có ít nhất một quyền trong khu vực admin.
 */
export async function requireAdminAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const permissions = await getUserPermissionsByUserId(user.appUser.id)
  if (permissions.length === 0) redirect("/home")

  return user
}

/**
 * Kiểm tra user có role admin không (non-throwing)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.appUser.role === USER_ROLES[2]
}

/**
 * Yêu cầu admin có permission cụ thể.
 */
export async function requireAdminPermission(permission: PermissionName): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const allowed = await checkUserPermission(user.appUser.id, permission)
  if (!allowed) redirect("/home")

  return user
}

/**
 * Kiểm tra admin có permission không (non-throwing)
 */
export async function hasAdminPermission(permission: PermissionName): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return checkUserPermission(user.appUser.id, permission)
}

/**
 * Lấy tất cả permission names của admin user hiện tại.
 */
export async function getAdminUserPermissions(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const perms = await getUserPermissionsByUserId(user.appUser.id)
  return perms
}
