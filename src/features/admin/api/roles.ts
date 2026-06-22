"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"
import type { LooseClient } from "@/lib/supabase/loose-types"
import type { PermissionName } from "@/lib/rbac"

import { requireAdminPermission } from "./admin-guard"
import { writeAuditLog } from "./audit-log"

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(50).regex(/^[a-z_]+$/, "Chỉ được dùng chữ thường và underscore"),
  description: z.string().trim().max(500).nullable().optional(),
  permissions: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
})

const updateRoleSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(50).regex(/^[a-z_]+$/, "Chỉ được dùng chữ thường và underscore"),
  description: z.string().trim().max(500).nullable().optional(),
  permissions: z.array(z.string()).min(1, "Phải chọn ít nhất 1 quyền"),
})

type RoleActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string }

export type AdminRoleRow = {
  id: number
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
  permission_count: number
  user_count: number
}

/**
 * Build AdminRoleRow list from base tables.
 * Query roles + aggregate permission_count + user_count separately.
 */
async function fetchRolesWithCounts(
  supabase: LooseClient,
  whereDeletedNull = true,
): Promise<AdminRoleRow[]> {
  let query = supabase
    .from("roles")
    .select("id, name, description, is_system, created_at, updated_at")

  if (whereDeletedNull) {
    query = query.is("deleted_at", null)
  }

  const { data: roles, error } = await query.order("id")

  if (error || !roles || roles.length === 0) return []

  const roleRows = roles as Array<{
    id: number; name: string; description: string | null;
    is_system: boolean; created_at: string; updated_at: string
  }>

  const roleIds = roleRows.map((r) => r.id)

  // Aggregate permission_count per role_id — single query
  const { data: permCounts } = await supabase
    .from("role_permissions")
    .select("role_id")
    .in("role_id", roleIds)

  const permCountMap = new Map<number, number>()
  for (const row of (permCounts ?? []) as Array<{ role_id: number }>) {
    permCountMap.set(row.role_id, (permCountMap.get(row.role_id) ?? 0) + 1)
  }

  // Aggregate user_count per role_id — single query
  const { data: userRows } = await supabase
    .from("users")
    .select("role_id")
    .in("role_id", roleIds)
    .is("deleted_at", null)

  const userCountMap = new Map<number, number>()
  for (const row of (userRows ?? []) as Array<{ role_id: number }>) {
    userCountMap.set(row.role_id, (userCountMap.get(row.role_id) ?? 0) + 1)
  }

  return roleRows.map((r) => ({
    ...r,
    permission_count: permCountMap.get(r.id) ?? 0,
    user_count: userCountMap.get(r.id) ?? 0,
  }))
}

/**
 * Lấy danh sách roles (admin only)
 */
export async function listAdminRoles(): Promise<AdminRoleRow[]> {
  await requireAdminPermission("roles.view")
  const supabase = createAdminClient() as unknown as LooseClient
  return fetchRolesWithCounts(supabase)
}

/**
 * Lấy danh sách role để lọc/gán trong màn người dùng.
 */
export async function listAssignableRoles(): Promise<AdminRoleRow[]> {
  await requireAdminPermission("users.view")
  const supabase = createAdminClient() as unknown as LooseClient
  return fetchRolesWithCounts(supabase)
}

/**
 * Lấy chi tiết role với permissions
 */
export async function getAdminRoleDetail(
  roleId: number,
): Promise<{
  role: AdminRoleRow
  permissions: PermissionName[]
} | null> {
  await requireAdminPermission("roles.view")
  const supabase = createAdminClient() as unknown as LooseClient

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, name, description, is_system, created_at, updated_at")
    .eq("id", roleId)
    .is("deleted_at", null)
    .single()

  if (roleError || !role) return null

  const roleData = role as AdminRoleRow

  const { data: perms } = await supabase
    .from("role_permissions")
    .select("permissions(name)")
    .eq("role_id", roleId)

  const permissions = ((perms ?? []) as Array<{ permissions: { name: string } }>)
    .map((rp) => rp.permissions?.name)
    .filter(Boolean) as PermissionName[]

  const [roles] = await Promise.all([fetchRolesWithCounts(supabase)])
  const fullRole = roles.find((r) => r.id === roleId) ?? { ...roleData, permission_count: permissions.length, user_count: 0 }

  return {
    role: fullRole,
    permissions,
  }
}

/**
 * Tạo role mới
 */
export async function createAdminRole(
  input: unknown,
): Promise<RoleActionResult> {
  const parsed = createRoleSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? "invalid_input", field: issue?.path.join(".") }
  }

  const current = await requireAdminPermission("roles.create")
  const supabase = createAdminClient() as unknown as LooseClient

  const { data: existing } = await supabase
    .from("roles")
    .select("id")
    .eq("name", parsed.data.name)
    .is("deleted_at", null)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: "Role name already exists", field: "name" }
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      is_system: false,
    })
    .select("id, name")
    .single()

  if (roleError || !role) {
    console.error("[admin:roles.create]", roleError)
    return { ok: false, error: "create_failed" }
  }

  const roleData = role as { id: number; name: string }

  const { data: permRows } = await supabase
    .from("permissions")
    .select("id, name")
    .in("name", parsed.data.permissions)

  if (!permRows || permRows.length !== parsed.data.permissions.length) {
    await supabase.from("roles").delete().eq("id", roleData.id)
    return { ok: false, error: "invalid_permissions", field: "permissions" }
  }

  const rolePerms = (permRows as Array<{ id: number; name: string }>).map((p) => ({
    role_id: roleData.id,
    permission_id: p.id,
  }))

  const { error: permError } = await supabase
    .from("role_permissions")
    .insert(rolePerms)

  if (permError) {
    console.error("[admin:roles.create:permissions]", permError)
    await supabase.from("roles").delete().eq("id", roleData.id)
    return { ok: false, error: "create_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "role.create",
    entityType: "roles",
    entityId: roleData.id,
    newData: { name: roleData.name, permissions: parsed.data.permissions },
  })

  revalidatePath("/admin/roles")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

/**
 * Cập nhật role
 */
export async function updateAdminRole(
  input: unknown,
): Promise<RoleActionResult> {
  const parsed = updateRoleSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? "invalid_input", field: issue?.path.join(".") }
  }

  const current = await requireAdminPermission("roles.edit")
  const supabase = createAdminClient() as unknown as LooseClient

  const { data: existing } = await supabase
    .from("roles")
    .select("id, name, is_system")
    .eq("id", parsed.data.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) {
    return { ok: false, error: "not_found" }
  }

  const existingData = existing as { id: number; name: string; is_system: boolean }

  if (existingData.name === "admin") {
    return { ok: false, error: "Cannot modify admin role" }
  }

  if (existingData.is_system && parsed.data.name !== existingData.name) {
    return { ok: false, error: "Cannot rename system role", field: "name" }
  }

  const { data: permRows } = await supabase
    .from("permissions")
    .select("id, name")
    .in("name", parsed.data.permissions)

  if (!permRows || permRows.length !== parsed.data.permissions.length) {
    return { ok: false, error: "invalid_permissions", field: "permissions" }
  }

  const { data: dup } = await supabase
    .from("roles")
    .select("id")
    .eq("name", parsed.data.name)
    .is("deleted_at", null)
    .neq("id", parsed.data.id)
    .maybeSingle()

  if (dup) {
    return { ok: false, error: "Role name already exists", field: "name" }
  }

  const { error: updateError } = await supabase
    .from("roles")
    .update({
      name: existingData.is_system ? existingData.name : parsed.data.name,
      description: parsed.data.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)

  if (updateError) {
    console.error("[admin:roles.update]", updateError)
    return { ok: false, error: "update_failed" }
  }

  await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", parsed.data.id)

  const rolePerms = (permRows as Array<{ id: number; name: string }>).map((p) => ({
    role_id: parsed.data.id,
    permission_id: p.id,
  }))

  const { error: permError } = await supabase
    .from("role_permissions")
    .insert(rolePerms)

  if (permError) {
    console.error("[admin:roles.update:permissions]", permError)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "role.update",
    entityType: "roles",
    entityId: parsed.data.id,
    oldData: { name: existingData.name },
    newData: {
      name: existingData.is_system ? existingData.name : parsed.data.name,
      permissions: parsed.data.permissions,
    },
  })

  revalidatePath("/admin/roles")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

/**
 * Xóa role (soft delete, chỉ role custom)
 */
export async function deleteAdminRole(
  roleId: number,
): Promise<RoleActionResult> {
  const current = await requireAdminPermission("roles.delete")
  const supabase = createAdminClient() as unknown as LooseClient

  const { data: existing } = await supabase
    .from("roles")
    .select("id, name, is_system")
    .eq("id", roleId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) {
    return { ok: false, error: "not_found" }
  }

  const existingData = existing as { id: number; name: string; is_system: boolean }

  if (existingData.is_system) {
    return { ok: false, error: "Cannot delete system role" }
  }

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId)
    .is("deleted_at", null)

  if (count && count > 0) {
    return { ok: false, error: "Role is still assigned to users" }
  }

  const { error } = await supabase
    .from("roles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", roleId)

  if (error) {
    console.error("[admin:roles.delete]", error)
    return { ok: false, error: "delete_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "role.delete",
    entityType: "roles",
    entityId: roleId,
    oldData: { name: existingData.name },
  })

  revalidatePath("/admin/roles")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}
