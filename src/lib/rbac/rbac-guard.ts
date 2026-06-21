import "server-only"

import { USER_ROLES } from "@/lib/constants"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import { ActionError } from "@/lib/action/server"

import type { PermissionName } from "./permissions"
import { checkUserPermission, checkUserAllPermissions, checkUserAnyPermission } from "./rbac"

/**
 * Yêu cầu user có permission cụ thể.
 * Throw ActionError nếu không có quyền.
 */
export async function requirePermission(permission: PermissionName): Promise<CurrentUser> {
  const user = await requireCurrentUser()

  const allowed = await checkUserPermission(user.appUser.id, permission)
  if (!allowed) {
    throw ActionError.key("insufficientPermissions")
  }

  return user
}

/**
 * Yêu cầu user có TẤT CẢ permissions (AND logic)
 */
export async function requireAllPermissions(
  permissions: PermissionName[],
): Promise<CurrentUser> {
  const user = await requireCurrentUser()

  const allowed = await checkUserAllPermissions(user.appUser.id, permissions)
  if (!allowed) {
    throw ActionError.key("insufficientPermissions")
  }

  return user
}

/**
 * Yêu cầu user có ÍT NHẤT 1 permission (OR logic)
 */
export async function requireAnyPermission(
  permissions: PermissionName[],
): Promise<CurrentUser> {
  const user = await requireCurrentUser()

  const allowed = await checkUserAnyPermission(user.appUser.id, permissions)
  if (!allowed) {
    throw ActionError.key("insufficientPermissions")
  }

  return user
}

/**
 * Kiểm tra user có permission không (non-throwing)
 */
export async function hasPermission(
  userId: number,
  permission: PermissionName,
): Promise<boolean> {
  return checkUserPermission(userId, permission)
}

/**
 * Kiểm tra user có role admin không (backward compat)
 */
export async function isAdminUser(): Promise<boolean> {
  const user = await requireCurrentUser()
  return user.appUser.role === USER_ROLES[2]
}
