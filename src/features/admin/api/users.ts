"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { UserRole, UserStatus } from "@/lib/constants"
import { USER_ROLES, USER_STATUSES } from "@/lib/constants"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { userActionSchema, type UserActionInput } from "../schemas"
import type { AdminUserListResult, AdminUserRow } from "../types"

export type ListUsersParams = {
  search?: string
  role?: UserRole | "all"
  status?: UserStatus | "all"
  page?: number
  pageSize?: number
}

export async function listAdminUsers(
  params: ListUsersParams = {},
): Promise<AdminUserListResult> {
  await requireAdmin()
  const supabase = createAdminClient()
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("users")
    .select("id, email, role, status, created_at, last_login_at", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (params.role && params.role !== "all" && USER_ROLES.includes(params.role)) {
    query = query.eq("role", params.role)
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
  if (error) {
    return { items: [], total: 0, page, pageSize }
  }

  const rows = (data ?? []) as Array<{
    id: number
    email: string
    role: UserRole
    status: UserStatus
    created_at: string
    last_login_at: string | null
  }>

  const ids = rows.map((r) => r.id)
  const profiles: Record<
    number,
    { displayName: string; avatarUrl: string | null }
  > = {}
  if (ids.length > 0) {
    const [{ data: members }, { data: companies }] = await Promise.all([
      supabase
        .from("member_profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids)
        .is("deleted_at", null),
      supabase
        .from("company_profiles")
        .select("user_id, name, logo_url")
        .in("user_id", ids)
        .is("deleted_at", null),
    ])
    for (const m of members ?? []) {
      profiles[m.user_id] = {
        displayName: m.full_name,
        avatarUrl: m.avatar_url,
      }
    }
    for (const c of companies ?? []) {
      profiles[c.user_id] = { displayName: c.name, avatarUrl: c.logo_url }
    }
  }

  const items: AdminUserRow[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    status: r.status,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
    displayName: profiles[r.id]?.displayName ?? r.email,
    avatarUrl: profiles[r.id]?.avatarUrl ?? null,
  }))

  return { items, total: count ?? 0, page, pageSize }
}

export type UserActionResult =
  | { ok: true; newStatus: UserStatus }
  | { ok: false; error: string }

export async function applyUserAction(
  input: UserActionInput,
): Promise<UserActionResult> {
  const parsed = userActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("users")
    .select("id, status, role")
    .eq("id", parsed.data.userId)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; status: UserStatus; role: UserRole }>()
  if (!target) return { ok: false, error: "not_found" }
  if (target.id === current.appUser.id) return { ok: false, error: "self" }
  if (target.role === "admin" && parsed.data.action !== "restore") {
    return { ok: false, error: "cannot_modify_admin" }
  }

  const map: Record<UserActionInput["action"], UserStatus> = {
    suspend: "suspended",
    ban: "banned",
    restore: "active",
  }
  const newStatus = map[parsed.data.action]

  const { error } = await supabase
    .from("users")
    .update({ status: newStatus })
    .eq("id", parsed.data.userId)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `user.${parsed.data.action}`,
    entityType: "users",
    entityId: parsed.data.userId,
    oldData: { status: target.status },
    newData: { status: newStatus },
    reason: parsed.data.reason,
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true, newStatus }
}
