import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminPermission } from "./admin-guard"
import {
  countAuditLogsByFilter,
  loadAuditLogs,
  loadDistinctAuditActions,
  loadDistinctAuditEntityTypes,
  type AuditFilterParams,
  type AuditLogPage,
  type ListAuditParams,
} from "../services/audit.service"

export type { AuditFilterParams, AuditLogPage, ListAuditParams }

/**
 * Load a page of audit log entries using the v_admin_audit_log view.
 * Actor resolution is done by the DB view (single query, O(1) JOIN).
 */
export async function listAuditLogs(
  params: ListAuditParams = {},
): Promise<AuditLogPage> {
  await requireAdminPermission("audit.view")
  const supabase = createAdminClient()
  return loadAuditLogs(supabase, params)
}

/**
 * Count total entries matching filters. O(1) — single COUNT query.
 */
export async function countAuditLogs(
  params: AuditFilterParams,
): Promise<number> {
  await requireAdminPermission("audit.view")
  const supabase = createAdminClient()
  return countAuditLogsByFilter(supabase, params)
}

/**
 * Get distinct action values for the filter dropdown. O(1) — cached RPC.
 */
export async function listDistinctActions(): Promise<string[]> {
  await requireAdminPermission("audit.view")
  const supabase = createAdminClient()
  return loadDistinctAuditActions(supabase)
}

/**
 * Get distinct entity_type values for the filter dropdown. O(1).
 */
export async function listDistinctEntityTypes(): Promise<string[]> {
  await requireAdminPermission("audit.view")
  const supabase = createAdminClient()
  return loadDistinctAuditEntityTypes(supabase)
}
