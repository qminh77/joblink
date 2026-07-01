import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type ListAuditParams = {
  search?: string
  action?: string
  entityType?: string
  limit?: number
  cursor?: number | null
}

export type AuditFilterParams = {
  search?: string
  action?: string
  entityType?: string
}

export type AuditLogRawRow = {
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

export async function listAuditLogRows(
  supabase: AdminSupabase,
  params: ListAuditParams = {},
) {
  const limit = Math.min(100, Math.max(10, params.limit ?? 50))

  let query = supabase
    .from("v_admin_audit_log")
    .select(
      "id, actor_id, actor_email, actor_name, action, entity_type, entity_id, old_data, new_data, reason, ip_address, created_at",
    )
    .order("id", { ascending: false })
    .limit(limit + 1)

  if (params.cursor) {
    query = query.lt("id", params.cursor)
  }
  if (params.action?.trim()) query = query.eq("action", params.action.trim())
  if (params.entityType?.trim()) {
    query = query.eq("entity_type", params.entityType.trim())
  }

  if (params.search?.trim()) {
    const q = params.search.trim()
    query = query.or(
      `action.ilike.%${q}%,entity_type.ilike.%${q}%,reason.ilike.%${q}%,actor_name.ilike.%${q}%,actor_email.ilike.%${q}%`,
    )
  }

  const { data, error } = await query
  if (error || !data) {
    return { rows: [], nextCursor: null }
  }

  const rows = data as unknown as AuditLogRawRow[]
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  return {
    rows: items,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  }
}

export async function countAuditLogRows(
  supabase: AdminSupabase,
  params: AuditFilterParams,
): Promise<number> {
  const { data } = await supabase.rpc("get_audit_log_count", {
    p_search: params.search?.trim() || null,
    p_action: params.action?.trim() || null,
    p_entity_type: params.entityType?.trim() || null,
  })
  return Number(data ?? 0)
}

export async function listDistinctAuditActions(
  supabase: AdminSupabase,
): Promise<string[]> {
  const { data } = await supabase.rpc("get_distinct_audit_actions")
  return ((data ?? []) as Array<{ action: string }>).map((row) => row.action)
}

export async function listDistinctAuditEntityTypes(
  supabase: AdminSupabase,
): Promise<string[]> {
  const { data } = await supabase.rpc("get_distinct_audit_entity_types")
  return ((data ?? []) as Array<{ entity_type: string }>).map(
    (row) => row.entity_type,
  )
}
