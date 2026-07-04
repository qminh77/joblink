import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { UserStatus } from "@/lib/constants"

import { writeAuditLog } from "./audit-log.service"
import type { UserActionInput } from "../schemas"
import {
  getAdminUserTarget,
  listAdminUserRows,
  listUserDisplayProfileRows,
  updateAdminUserStatus,
} from "../data/users.repo"
import type {
  AdminUserListResult,
  AdminUserRow,
  ListUsersParams,
  UserActionResult,
} from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

type AdminActor = {
  appUser: { id: number }
}

type DisplayProfile = {
  displayName: string
  avatarUrl: string | null
}

export async function loadAdminUsers(
  supabase: AdminSupabase,
  params: ListUsersParams = {},
): Promise<AdminUserListResult> {
  const { rows, count, error, page, pageSize } = await listAdminUserRows(
    supabase,
    params,
  )
  if (error) return { items: [], total: 0, page, pageSize }

  const profiles = await buildDisplayProfiles(
    supabase,
    rows.map((row) => row.id),
    true,
  )

  const items: AdminUserRow[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    displayName: profiles[row.id]?.displayName ?? row.email,
    avatarUrl: profiles[row.id]?.avatarUrl ?? null,
  }))

  return { items, total: count, page, pageSize }
}

export async function applyUserModerationAction(
  supabase: AdminSupabase,
  actor: AdminActor,
  input: UserActionInput,
): Promise<UserActionResult> {
  const { data: target } = await getAdminUserTarget(supabase, input.userId)
  if (!target) return { ok: false, error: "not_found" }
  if (target.id === actor.appUser.id) return { ok: false, error: "self" }

  if (target.role === "admin" && input.action !== "restore") {
    return { ok: false, error: "cannot_modify_admin" }
  }

  const newStatus = userActionStatus(input.action)
  const { error } = await updateAdminUserStatus(
    supabase,
    input.userId,
    newStatus,
  )
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `user.${input.action}`,
    entityType: "users",
    entityId: input.userId,
    oldData: { status: target.status },
    newData: { status: newStatus },
    reason: input.reason,
  })

  return { ok: true, newStatus }
}

async function buildDisplayProfiles(
  supabase: AdminSupabase,
  userIds: number[],
  includeAvatar: boolean,
) {
  const profiles: Record<number, DisplayProfile> = {}
  const { members, companies } = await listUserDisplayProfileRows(
    supabase,
    userIds,
    includeAvatar,
  )

  for (const member of members) {
    if (!member.full_name) continue
    profiles[member.user_id] = {
      displayName: member.full_name,
      avatarUrl: member.avatar_url ?? null,
    }
  }
  for (const company of companies) {
    if (!company.name) continue
    profiles[company.user_id] = {
      displayName: company.name,
      avatarUrl: company.logo_url ?? null,
    }
  }

  return profiles
}

function userActionStatus(action: UserActionInput["action"]): UserStatus {
  const map: Record<UserActionInput["action"], UserStatus> = {
    suspend: "suspended",
    ban: "banned",
    restore: "active",
  }
  return map[action]
}
