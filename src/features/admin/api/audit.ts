import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
import type { AdminAuditLogEntry } from "../types"

export type ListAuditParams = {
  search?: string
  action?: string
  entityType?: string
  limit?: number
  cursor?: number | null
}

export type AuditLogPage = {
  items: AdminAuditLogEntry[]
  nextCursor: number | null
  total: number
}

type RawRow = {
  id: number
  actor_id: number | null
  actor_email: string | null
  actor_name: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  old_data: unknown
  new_data: unknown
  reason: string | null
  ip_address: string | null
  created_at: string
}

/**
 * Load a page of audit log entries using the v_admin_audit_log view.
 * Actor resolution is done by the DB view (single query, O(1) JOIN).
 * Cursor-based pagination: pass the last item's id as `cursor` to get the next page.
 */
export async function listAuditLogs(
  params: ListAuditParams = {},
): Promise<AuditLogPage> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(100, Math.max(10, params.limit ?? 50))

  let query = supabase
    .from("v_admin_audit_log")
    .select(
      "id, actor_id, actor_email, actor_name, action, entity_type, entity_id, old_data, new_data, reason, ip_address, created_at",
    )
    .order("id", { ascending: false })
    .limit(limit + 1) // fetch one extra to detect next page

  if (params.cursor) {
    query = query.lt("id", params.cursor)
  }
  if (params.action?.trim()) query = query.eq("action", params.action.trim())
  if (params.entityType?.trim())
    query = query.eq("entity_type", params.entityType.trim())

  if (params.search?.trim()) {
    const q = params.search.trim()
    query = query.or(
      `action.ilike.%${q}%,entity_type.ilike.%${q}%,reason.ilike.%${q}%,actor_name.ilike.%${q}%,actor_email.ilike.%${q}%`,
    )
  }

  const { data, error } = await query
  if (error || !data) return { items: [], nextCursor: null, total: 0 }

  const rows = data as unknown as RawRow[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null

  return {
    items: items.map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorName: r.actor_name ?? null,
      actorEmail: r.actor_email ?? null,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      oldData: r.old_data,
      newData: r.new_data,
      reason: r.reason,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
    })),
    nextCursor,
    total: 0, // populated separately by countAuditLogs
  }
}

/**
 * Count total entries matching filters. O(1) — single COUNT query.
 */
export async function countAuditLogs(params: {
  search?: string
  action?: string
  entityType?: string
}): Promise<number> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.rpc("get_audit_log_count", {
    p_search: params.search?.trim() || null,
    p_action: params.action?.trim() || null,
    p_entity_type: params.entityType?.trim() || null,
  })
  return Number(data ?? 0)
}

/**
 * Get distinct action values for the filter dropdown. O(1) — cached RPC.
 */
export async function listDistinctActions(): Promise<string[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.rpc("get_distinct_audit_actions")
  return ((data ?? []) as Array<{ action: string }>).map((r) => r.action)
}

/**
 * Get distinct entity_type values for the filter dropdown. O(1).
 */
export async function listDistinctEntityTypes(): Promise<string[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.rpc("get_distinct_audit_entity_types")
  return ((data ?? []) as Array<{ entity_type: string }>).map(
    (r) => r.entity_type,
  )
}
