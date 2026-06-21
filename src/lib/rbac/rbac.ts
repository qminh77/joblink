import "server-only"

import { cache } from "react"

import { USER_ROLES } from "@/lib/constants"
import { createAdminClient } from "@/lib/supabase/admin"
import type { LooseClient } from "@/lib/supabase/loose-types"

import type { ModuleName } from "./modules"
import type { ActionName } from "./actions"
import type { PermissionName } from "./permissions"
import { getAllPermissionNames } from "./permissions"

export type RoleRow = {
  id: number
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export type RoleWithPermissions = RoleRow & {
  permissions: PermissionName[]
  permission_count: number
  user_count: number
}

export type PermissionRow = {
  id: number
  name: string
  label: string
  module_name: ModuleName
  module_label: string
  action_name: ActionName
  action_label: string
}

/**
 * Lấy tất cả roles (có cache trong 1 request)
 */
export const getAllRoles = cache(async (): Promise<RoleRow[]> => {
  const supabase = createAdminClient() as unknown as LooseClient
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, is_system, created_at, updated_at")
    .is("deleted_at", null)
    .order("id")

  if (error) {
    console.error("[rbac:getAllRoles]", error)
    return []
  }

  return (data ?? []) as RoleRow[]
})

/**
 * Lấy role by ID với permissions — parallel queries cho performance
 */
export const getRoleById = cache(
  async (roleId: number): Promise<RoleWithPermissions | null> => {
    const supabase = createAdminClient() as unknown as LooseClient

    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, name, description, is_system, created_at, updated_at")
      .eq("id", roleId)
      .is("deleted_at", null)
      .single()

    if (roleError || !role) return null

    const roleData = role as RoleRow

    // Parallel queries instead of sequential
    const [permsResult, permCountResult, userCountResult] = await Promise.all([
      supabase
        .from("role_permissions")
        .select("permissions(name)")
        .eq("role_id", roleId),
      supabase
        .from("role_permissions")
        .select("permission_id", { count: "exact", head: true })
        .eq("role_id", roleId),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role_id", roleId)
        .is("deleted_at", null),
    ])

    const permissions = ((permsResult.data ?? []) as Array<{ permissions: { name: string } }>)
      .map((rp) => rp.permissions?.name)
      .filter(Boolean) as PermissionName[]

    return {
      ...roleData,
      permissions,
      permission_count: permCountResult.count ?? 0,
      user_count: userCountResult.count ?? 0,
    }
  },
)

/**
 * Lấy role by name
 */
export const getRoleByName = cache(
  async (name: string): Promise<RoleRow | null> => {
    const supabase = createAdminClient() as unknown as LooseClient
    const { data, error } = await supabase
      .from("roles")
      .select("id, name, description, is_system, created_at, updated_at")
      .eq("name", name)
      .is("deleted_at", null)
      .single()

    if (error || !data) return null
    return data as RoleRow
  },
)

/**
 * Lấy tất cả permissions — query base tables directly
 */
export const getAllPermissions = cache(
  async (): Promise<PermissionRow[]> => {
    const supabase = createAdminClient() as unknown as LooseClient
    const { data, error } = await supabase
      .from("permissions")
      .select("id, name, label, modules(name, label, sort_order), actions(name, label)")
      .order("name")

    if (error) {
      console.error("[rbac:getAllPermissions]", error.message, error)
      return []
    }

    if (!data || data.length === 0) {
      console.warn("[rbac:getAllPermissions] empty — tables may not exist yet")
      return []
    }

    return (data as Array<Record<string, unknown>>).map((row) => {
      const mod = row.modules as { name: string; label: string; sort_order: number } | null
      const act = row.actions as { name: string; label: string } | null
      return {
        id: row.id as number,
        name: row.name as string,
        label: row.label as string,
        module_name: (mod?.name ?? "") as ModuleName,
        module_label: mod?.label ?? "",
        action_name: (act?.name ?? "") as ActionName,
        action_label: act?.label ?? "",
      }
    }) as PermissionRow[]
  },
)

/**
 * Lấy permissions của user — single query với role_permissions + permissions join
 */
export const getUserPermissionsByUserId = cache(
  async (userId: number): Promise<PermissionName[]> => {
    const supabase = createAdminClient()

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role_id, role")
      .eq("id", userId)
      .is("deleted_at", null)
      .single()

    if (userError || !user) {
      console.error("[rbac:getUserPermissions] user not found:", userError?.message)
      return []
    }

    const userData = user as { role_id: number | null; role: string }

    // If role_id is set, batch query via role_permissions + permissions
    if (userData.role_id) {
      const { data: rpData, error: rpError } = await supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", userData.role_id)

      if (rpError) {
        console.error("[rbac:getUserPermissions] query error:", rpError.message)
        if (userData.role === USER_ROLES[2]) return getAllPermissionNames()
        return []
      }

      if (!rpData || rpData.length === 0) return []

      const permIds = (rpData as Array<{ permission_id: number }>).map((r) => r.permission_id)

      const { data: permData } = await supabase
        .from("permissions")
        .select("name")
        .in("id", permIds)

      return ((permData ?? []) as Array<{ name: string }>)
        .map((p) => p.name as PermissionName)
    }

    // Fallback: admin gets all permissions via legacy role
    if (userData.role === USER_ROLES[2]) {
      return getAllPermissionNames()
    }

    return []
  },
)

/**
 * Kiểm tra user có permission cụ thể không
 * O(1) — uses direct queries with index
 */
export async function checkUserPermission(
  userId: number,
  permission: PermissionName,
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("role_id, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .single()

  if (!user) return false
  const userData = user as { role_id: number | null; role: string }

  // role_id set → check via role_permissions
  if (userData.role_id) {
    const { data } = await supabase
      .from("role_permissions")
      .select("permission_id, permissions!inner(name)")
      .eq("role_id", userData.role_id)
      .eq("permissions.name", permission)
      .limit(1)

    return (data ?? []).length > 0
  }

  // Fallback: admin has all permissions via legacy role
  if (userData.role === USER_ROLES[2]) return true
  return false
}

/**
 * Kiểm tra user có TẤT CẢ permissions không (AND logic)
 * Batches into single query instead of N+1
 */
export async function checkUserAllPermissions(
  userId: number,
  permissions: PermissionName[],
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("role_id, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .single()

  if (!user) return false
  const userData = user as { role_id: number | null; role: string }

  if (userData.role === USER_ROLES[2]) return true

  if (!userData.role_id) return false

  const { data: rpData } = await supabase
    .from("role_permissions")
    .select("permissions!inner(name)")
    .eq("role_id", userData.role_id)
    .in("permissions.name", permissions)

  if (!rpData) return false

  const foundNames = new Set(
    (rpData as unknown as Array<{ permissions: { name: string } | null }>).map(
      (r) => r.permissions?.name,
    ).filter(Boolean),
  )
  return permissions.every((p) => foundNames.has(p))
}

/**
 * Kiểm tra user có ÍT NHẤT 1 permission không (OR logic)
 * Batches into single query instead of N+1
 */
export async function checkUserAnyPermission(
  userId: number,
  permissions: PermissionName[],
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("role_id, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .single()

  if (!user) return false
  const userData = user as { role_id: number | null; role: string }

  if (userData.role === USER_ROLES[2]) return true

  if (!userData.role_id) return false

  const { data: rpData } = await supabase
    .from("role_permissions")
    .select("permissions!inner(name)")
    .eq("role_id", userData.role_id)
    .in("permissions.name", permissions)
    .limit(1)

  return (rpData ?? []).length > 0
}
