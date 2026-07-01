import "server-only"

import { cache } from "react"

import type { UserRole } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"

import type { PermissionName } from "./permissions"
import { getAllPermissionNames } from "./permissions"

type UserRoleLookup = {
  role: UserRole
}

const MEMBER_PERMISSIONS = [
  "feed.view",
  "search.view",
  "network.view",
  "network.follow",
  "network.connect",
  "network.block",
  "messages.view",
  "messages.send",
  "notifications.view",
  "notifications.edit",
  "profile.view",
  "profile.edit",
  "cvs.view",
  "cvs.create",
  "cvs.edit",
  "cvs.delete",
  "companies.view",
  "companies.follow",
  "jobs.view",
  "jobs.apply",
  "jobs.save",
  "posts.view",
  "posts.create",
  "posts.edit",
  "posts.comment",
  "posts.react",
  "posts.share",
  "posts.delete",
  "reports.create",
  "settings.view",
  "settings.edit",
] satisfies PermissionName[]

const COMPANY_PERMISSIONS = [
  "feed.view",
  "search.view",
  "network.view",
  "network.follow",
  "network.connect",
  "network.block",
  "messages.view",
  "messages.send",
  "notifications.view",
  "notifications.edit",
  "profile.view",
  "profile.edit",
  "companies.view",
  "companies.follow",
  "companies.edit",
  "jobs.view",
  "jobs.create",
  "jobs.edit",
  "posts.view",
  "posts.create",
  "posts.edit",
  "posts.comment",
  "posts.react",
  "posts.share",
  "posts.delete",
  "reports.create",
  "settings.view",
  "settings.edit",
] satisfies PermissionName[]

const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionName[]> = {
  admin: getAllPermissionNames(),
  member: MEMBER_PERMISSIONS,
  company: COMPANY_PERMISSIONS,
}

export function getPermissionsForRole(role: UserRole): PermissionName[] {
  return [...ROLE_PERMISSIONS[role]]
}

export function roleHasPermission(
  role: UserRole,
  permission: PermissionName,
): boolean {
  return role === "admin" || ROLE_PERMISSIONS[role].includes(permission)
}

export const getUserPermissionsByUserId = cache(
  async (userId: number): Promise<PermissionName[]> => {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .is("deleted_at", null)
      .single<UserRoleLookup>()

    if (error || !data) {
      console.error("[roles:getUserPermissions] user not found:", error?.message)
      return []
    }

    return getPermissionsForRole(data.role)
  },
)

export async function checkUserPermission(
  userId: number,
  permission: PermissionName,
): Promise<boolean> {
  const permissions = await getUserPermissionsByUserId(userId)
  return permissions.includes(permission)
}

export async function checkUserAllPermissions(
  userId: number,
  permissions: PermissionName[],
): Promise<boolean> {
  const allowed = await getUserPermissionsByUserId(userId)
  return permissions.every((permission) => allowed.includes(permission))
}

export async function checkUserAnyPermission(
  userId: number,
  permissions: PermissionName[],
): Promise<boolean> {
  const allowed = await getUserPermissionsByUserId(userId)
  return permissions.some((permission) => allowed.includes(permission))
}
