import "server-only"

import { USER_STATUSES, type UserRole, type UserStatus } from "@/lib/constants"
import type { createAdminClient } from "@/lib/supabase/admin"

import type { ExportUsersParams, ListUsersParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AdminUserRecord = {
  id: number
  email: string
  role: UserRole
  status: UserStatus
  created_at: string
  last_login_at: string | null
  role_id: number | null
}

export type UserProfileNameRow = {
  user_id: number
  full_name?: string
  name?: string
  avatar_url?: string | null
  logo_url?: string | null
}

export type AdminUserTargetRecord = {
  id: number
  status: UserStatus
  role: UserRole
}

export async function listAdminUserRows(
  supabase: AdminSupabase,
  params: ListUsersParams,
) {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("users")
    .select("id, email, role, status, created_at, last_login_at, role_id", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (typeof params.roleId === "number") {
    query = query.eq("role_id", params.roleId)
  }
  if (
    params.status &&
    params.status !== "all" &&
    USER_STATUSES.includes(params.status)
  ) {
    query = query.eq("status", params.status)
  }
  if (params.search?.trim()) {
    query = query.ilike("email", `%${params.search.trim()}%`)
  }

  const { data, count, error } = await query
  return {
    rows: (data ?? []) as AdminUserRecord[],
    count: count ?? 0,
    error,
    page,
    pageSize,
  }
}

export async function listAdminUserExportRows(
  supabase: AdminSupabase,
  params: ExportUsersParams,
) {
  let query = supabase
    .from("users")
    .select("id, email, role, status, created_at, last_login_at, role_id")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10000)

  if (
    params.roleId &&
    params.roleId !== "all"
  ) {
    const roleId = Number(params.roleId)
    if (Number.isInteger(roleId) && roleId > 0) {
      query = query.eq("role_id", roleId)
    }
  }
  if (
    params.status &&
    params.status !== "all" &&
    (USER_STATUSES as readonly string[]).includes(params.status)
  ) {
    query = query.eq("status", params.status as UserStatus)
  }
  if (params.search?.trim()) {
    query = query.ilike("email", `%${params.search.trim()}%`)
  }

  const { data, error } = await query
  return { rows: (data ?? []) as AdminUserRecord[], error }
}

export async function listUserDisplayProfileRows(
  supabase: AdminSupabase,
  userIds: number[],
  includeAvatar: boolean,
) {
  if (userIds.length === 0) {
    return { members: [], companies: [] }
  }

  const [{ data: members }, { data: companies }] = includeAvatar
    ? await Promise.all([
        supabase
          .from("member_profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds)
          .is("deleted_at", null),
        supabase
          .from("company_profiles")
          .select("user_id, name, logo_url")
          .in("user_id", userIds)
          .is("deleted_at", null),
      ])
    : await Promise.all([
        supabase
          .from("member_profiles")
          .select("user_id, full_name")
          .in("user_id", userIds)
          .is("deleted_at", null),
        supabase
          .from("company_profiles")
          .select("user_id, name")
          .in("user_id", userIds)
          .is("deleted_at", null),
      ])

  return {
    members: (members ?? []) as UserProfileNameRow[],
    companies: (companies ?? []) as UserProfileNameRow[],
  }
}

export function getAdminUserTarget(supabase: AdminSupabase, userId: number) {
  return supabase
    .from("users")
    .select("id, status, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle<AdminUserTargetRecord>()
}

export function updateAdminUserStatus(
  supabase: AdminSupabase,
  userId: number,
  status: UserStatus,
) {
  return supabase.from("users").update({ status }).eq("id", userId)
}
