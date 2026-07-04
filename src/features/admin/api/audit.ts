import "server-only"

// SRS UC Trace - M09 UC-67 Xem nhat ky quan tri.
// Flow: /admin/audit-log -> audit log API -> audit service/repo -> v_admin_audit_log/filter RPC.

import { requireAdminClient } from "../services/admin-context.service"
import {
  countAuditLogsByFilter,
  loadAuditLogs,
  loadAuditLogPageData,
  loadDistinctAuditActions,
  loadDistinctAuditEntityTypes,
  type AuditFilterParams,
  type AuditLogPage,
  type AuditLogPageData,
  type ListAuditParams,
} from "../services/audit.service"

export type {
  AuditFilterParams,
  AuditLogPage,
  AuditLogPageData,
  ListAuditParams,
}

/**
 * Load a page of audit log entries using the v_admin_audit_log view.
 * Actor resolution is done by the DB view (single query, O(1) JOIN).
 */
export async function listAuditLogs(
  params: ListAuditParams = {},
): Promise<AuditLogPage> {
  const supabase = await requireAdminClient()
  return loadAuditLogs(supabase, params)
}

/**
 * Count total entries matching filters. O(1) — single COUNT query.
 */
export async function countAuditLogs(
  params: AuditFilterParams,
): Promise<number> {
  const supabase = await requireAdminClient()
  return countAuditLogsByFilter(supabase, params)
}

/**
 * Get distinct action values for the filter dropdown. O(1) — cached RPC.
 */
export async function listDistinctActions(): Promise<string[]> {
  const supabase = await requireAdminClient()
  return loadDistinctAuditActions(supabase)
}

/**
 * Get distinct entity_type values for the filter dropdown. O(1).
 */
export async function listDistinctEntityTypes(): Promise<string[]> {
  const supabase = await requireAdminClient()
  return loadDistinctAuditEntityTypes(supabase)
}

export async function loadAdminAuditLogPage(
  params: ListAuditParams = {},
): Promise<AuditLogPageData> {
  const supabase = await requireAdminClient()
  return loadAuditLogPageData(supabase, params)
}
