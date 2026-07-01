import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

import {
  countAuditLogRows,
  listAuditLogRows,
  listDistinctAuditActions,
  listDistinctAuditEntityTypes,
  type AuditFilterParams,
  type AuditLogRawRow,
  type ListAuditParams,
} from "../data/audit.repo"
import type { AdminAuditLogEntry } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AuditLogPage = {
  items: AdminAuditLogEntry[]
  nextCursor: number | null
  total: number
}

export type AuditLogPageData = {
  page: AuditLogPage
  total: number
  actions: string[]
  entityTypes: string[]
}

export type { AuditFilterParams, ListAuditParams }

export async function loadAuditLogs(
  supabase: AdminSupabase,
  params: ListAuditParams = {},
): Promise<AuditLogPage> {
  const page = await listAuditLogRows(supabase, params)

  return {
    items: page.rows.map(mapAuditLogEntry),
    nextCursor: page.nextCursor,
    total: 0, // populated separately by countAuditLogs
  }
}

export function countAuditLogsByFilter(
  supabase: AdminSupabase,
  params: AuditFilterParams,
): Promise<number> {
  return countAuditLogRows(supabase, params)
}

export function loadDistinctAuditActions(
  supabase: AdminSupabase,
): Promise<string[]> {
  return listDistinctAuditActions(supabase)
}

export function loadDistinctAuditEntityTypes(
  supabase: AdminSupabase,
): Promise<string[]> {
  return listDistinctAuditEntityTypes(supabase)
}

export async function loadAuditLogPageData(
  supabase: AdminSupabase,
  params: ListAuditParams = {},
): Promise<AuditLogPageData> {
  const [page, total, actions, entityTypes] = await Promise.all([
    loadAuditLogs(supabase, params),
    countAuditLogsByFilter(supabase, params),
    loadDistinctAuditActions(supabase),
    loadDistinctAuditEntityTypes(supabase),
  ])

  return { page, total, actions, entityTypes }
}

function mapAuditLogEntry(row: AuditLogRawRow): AdminAuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name ?? null,
    actorEmail: row.actor_email ?? null,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldData: row.old_data,
    newData: row.new_data,
    reason: row.reason,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  }
}
