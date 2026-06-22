"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { checkUserPermission } from "@/lib/rbac"

import { requireAdminPermission } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { userActionSchema, type UserActionInput } from "../schemas"
import {
  applyUserModerationAction,
  exportUsersCsv,
  loadAdminUsers,
} from "../services/users.service"
import type {
  AdminUserListResult,
  ExportUsersParams,
  ListUsersParams,
  UserActionResult,
} from "../types"

export type {
  ExportUsersParams,
  ListUsersParams,
  UserActionResult,
} from "../types"

export async function listAdminUsers(
  params: ListUsersParams = {},
): Promise<AdminUserListResult> {
  await requireAdminPermission("users.view")
  const supabase = createAdminClient()
  return loadAdminUsers(supabase, params)
}

export async function exportUsersCsvAction(
  params: ExportUsersParams = {},
): Promise<{ ok: true; filename: string; csv: string } | { ok: false }> {
  const current = await requireAdminPermission("users.export")
  const supabase = createAdminClient()
  return exportUsersCsv(supabase, current, params)
}

export async function applyUserAction(
  input: UserActionInput,
): Promise<UserActionResult> {
  const parsed = userActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminPermission("users.suspend")
  const supabase = createAdminClient()
  const result = await applyUserModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminUserViews()
  return result
}

function revalidateAdminUserViews() {
  revalidatePath("/admin/users")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
}

export async function updateUserRbacRole(
  userId: number,
  roleName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await requireAdminPermission("users.edit")
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, error: "invalid_user" }
  }
  if (!roleName || typeof roleName !== "string") {
    return { ok: false, error: "invalid_role" }
  }

  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!target) return { ok: false, error: "not_found" }
  if (target.id === current.appUser.id) return { ok: false, error: "self" }

  if (target.role === "admin") {
    return { ok: false, error: "cannot_modify_admin" }
  }

  const { data: role } = await supabase
    .from("roles")
    .select("id, name")
    .eq("name", roleName)
    .is("deleted_at", null)
    .maybeSingle()

  if (!role) return { ok: false, error: "role_not_found" }
  if (
    role.name === "admin" &&
    !(await checkUserPermission(current.appUser.id, "roles.edit"))
  ) {
    return { ok: false, error: "cannot_assign_admin" }
  }

  const { error } = await supabase
    .from("users")
    .update({ role: role.name as never })
    .eq("id", userId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "user.rbac_role.update",
    entityType: "users",
    entityId: userId,
    oldData: { role: target.role },
    newData: { role: role.name },
  })

  revalidateAdminUserViews()
  return { ok: true }
}
