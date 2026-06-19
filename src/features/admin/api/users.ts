"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
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
  await requireAdmin()
  const supabase = createAdminClient()
  return loadAdminUsers(supabase, params)
}

export async function exportUsersCsvAction(
  params: ExportUsersParams = {},
): Promise<{ ok: true; filename: string; csv: string } | { ok: false }> {
  const current = await requireAdmin()
  const supabase = createAdminClient()
  return exportUsersCsv(supabase, current, params)
}

export async function applyUserAction(
  input: UserActionInput,
): Promise<UserActionResult> {
  const parsed = userActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
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
