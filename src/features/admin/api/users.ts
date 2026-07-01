"use server"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
import { revalidateAdminSection } from "./revalidation"
import { userActionSchema, type UserActionInput } from "../schemas"
import {
  applyUserModerationAction,
  loadAdminUsers,
} from "../services/users.service"
import type {
  AdminUserListResult,
  ListUsersParams,
  UserActionResult,
} from "../types"

export type {
  ListUsersParams,
  UserActionResult,
} from "../types"

export async function listAdminUsers(
  params: ListUsersParams = {},
): Promise<AdminUserListResult> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAdminUsers(supabase, params)
}

export async function applyUserAction(
  input: UserActionInput,
): Promise<UserActionResult> {
  const parsed = userActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
  const result = await applyUserModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("users")
  return result
}
