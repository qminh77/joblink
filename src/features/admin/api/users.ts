"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminPermission } from "./admin-guard"
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

export async function updateUserAdminRole(
  userId: number,
  role: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminPermission("users.edit")
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("users")
    .update({ role } as never)
    .eq("id", userId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateAdminUserViews()
  return { ok: true }
}

export async function updateUserRbacRole(
  userId: number,
  roleId: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdminPermission("users.edit")
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("users")
    .update({ role_id: roleId } as never)
    .eq("id", userId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidateAdminUserViews()
  return { ok: true }
}
