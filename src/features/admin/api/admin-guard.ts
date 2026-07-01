import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import { getPermissionsForRole } from "@/lib/rbac"
import type { PermissionName } from "@/lib/rbac"

function isAdminRole(user: CurrentUser): boolean {
  return user.appUser.role === "admin"
}

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

  if (!isAdminRole(user)) redirect("/home")

  return user
}

/**
 * Kiểm tra user có role admin không (non-throwing)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return isAdminRole(user)
}

/**
 * Yêu cầu admin có permission cụ thể.
 */
export async function requireAdminPermission(permission: PermissionName): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  void permission
  if (!isAdminRole(user)) redirect("/home")

  return user
}

/**
 * Kiểm tra admin có permission không (non-throwing)
 */
export async function hasAdminPermission(permission: PermissionName): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  void permission
  return isAdminRole(user)
}

/**
 * Lấy tất cả permission names của admin user hiện tại.
 */
export async function getAdminUserPermissions(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  return getPermissionsForRole(user.appUser.role)
}
