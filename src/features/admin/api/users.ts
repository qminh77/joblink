"use server"

// SRS UC Trace - M09 UC-62 Quan ly trang thai nguoi dung.
// Flow: /admin/users -> users panel -> admin users API -> users service/repo -> audit + revalidate admin section.

import {
  requireAdminClient,
  requireAdminContext,
} from "../services/admin-context.service"
import { revalidateAdminSection } from "../services/admin-revalidation.service"
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
  const supabase = await requireAdminClient()
  return loadAdminUsers(supabase, params)
}

export async function applyUserAction(
  input: UserActionInput,
): Promise<UserActionResult> {
  const parsed = userActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const { current, supabase } = await requireAdminContext()
  const result = await applyUserModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("users")
  return result
}
