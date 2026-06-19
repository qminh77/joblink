import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
import type { AdminAuditLogEntry } from "../types"

export type ListAuditParams = {
  search?: string
  action?: string
  entityType?: string
  limit?: number
}

type RawRow = {
  id: number
  actor_id: number | null
  action: string
  entity_type: string | null
  entity_id: number | null
  old_data: unknown
  new_data: unknown
  reason: string | null
  ip_address: string | null
  created_at: string
}

export async function listAuditLogs(
  params: ListAuditParams = {},
): Promise<AdminAuditLogEntry[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(500, Math.max(20, params.limit ?? 100))

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, entity_type, entity_id, old_data, new_data, reason, ip_address, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.action?.trim()) query = query.eq("action", params.action.trim())
  if (params.entityType?.trim())
    query = query.eq("entity_type", params.entityType.trim())

  if (params.search?.trim()) {
    const q = params.search.trim()
    query = query.or(
      `action.ilike.%${q}%,entity_type.ilike.%${q}%,reason.ilike.%${q}%`,
    )
  }

  const { data, error } = await query
  if (error || !data) return []

  const rows = data as unknown as RawRow[]

  const actorIds = [
    ...new Set(
      rows
        .map((r) => r.actor_id)
        .filter((v): v is number => typeof v === "number"),
    ),
  ]
  const actorMap: Record<
    number,
    { email: string | null; name: string | null }
  > = {}
  if (actorIds.length > 0) {
    const [{ data: users }, { data: members }, { data: companies }] =
      await Promise.all([
        supabase.from("users").select("id, email").in("id", actorIds),
        supabase
          .from("member_profiles")
          .select("user_id, full_name")
          .in("user_id", actorIds)
          .is("deleted_at", null),
        supabase
          .from("company_profiles")
          .select("user_id, name")
          .in("user_id", actorIds)
          .is("deleted_at", null),
      ])
    for (const u of (users ?? []) as Array<{ id: number; email: string }>) {
      actorMap[u.id] = { email: u.email, name: null }
    }
    for (const m of (members ?? []) as Array<{
      user_id: number
      full_name: string
    }>) {
      const entry = actorMap[m.user_id] ?? { email: null, name: null }
      entry.name = m.full_name
      actorMap[m.user_id] = entry
    }
    for (const c of (companies ?? []) as Array<{
      user_id: number
      name: string
    }>) {
      const entry = actorMap[c.user_id] ?? { email: null, name: null }
      entry.name = c.name
      actorMap[c.user_id] = entry
    }
  }

  return rows.map((r) => {
    const actor = r.actor_id != null ? actorMap[r.actor_id] : null
    return {
      id: r.id,
      actorId: r.actor_id,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? null,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      oldData: r.old_data,
      newData: r.new_data,
      reason: r.reason,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
    }
  })
}

export async function listDistinctActions(): Promise<string[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.rpc("get_distinct_audit_actions")
  return ((data ?? []) as Array<{ action: string }>).map((r) => r.action)
}
