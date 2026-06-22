import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import { checkUserPermission, getUserPermissionsByUserId } from "@/lib/rbac"
import type { PermissionName } from "@/lib/rbac"

const ADMIN_ACCESS_PERMISSION = "admin.access" satisfies PermissionName

/**
 * Yêu cầu user phải là admin (backward compat).
 */
export async function requireAdmin(): Promise<CurrentUser> {
  return requireAdminAccess()
}

/**
 * Yêu cầu user có ít nhất một quyền trong khu vực admin.
 */
export async function requireAdminAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const allowed = await checkUserPermission(
    user.appUser.id,
    ADMIN_ACCESS_PERMISSION,
  )
  if (!allowed) redirect("/home")

  return user
}

/**
 * Kiểm tra user có role admin không (non-throwing)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return checkUserPermission(user.appUser.id, ADMIN_ACCESS_PERMISSION)
}

/**
 * Yêu cầu admin có permission cụ thể.
 */
export async function requireAdminPermission(permission: PermissionName): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [canAccessAdmin, allowed] = await Promise.all([
    checkUserPermission(user.appUser.id, ADMIN_ACCESS_PERMISSION),
    checkUserPermission(user.appUser.id, permission),
  ])
  if (!canAccessAdmin) redirect("/home")
  if (!allowed) redirect("/home")

  return user
}

/**
 * Kiểm tra admin có permission không (non-throwing)
 */
export async function hasAdminPermission(permission: PermissionName): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const [canAccessAdmin, allowed] = await Promise.all([
    checkUserPermission(user.appUser.id, ADMIN_ACCESS_PERMISSION),
    checkUserPermission(user.appUser.id, permission),
  ])
  return canAccessAdmin && allowed
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
