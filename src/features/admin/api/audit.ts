import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
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
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAuditLogs(supabase, params)
}

/**
 * Count total entries matching filters. O(1) — single COUNT query.
 */
export async function countAuditLogs(
  params: AuditFilterParams,
): Promise<number> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return countAuditLogsByFilter(supabase, params)
}

/**
 * Get distinct action values for the filter dropdown. O(1) — cached RPC.
 */
export async function listDistinctActions(): Promise<string[]> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadDistinctAuditActions(supabase)
}

/**
 * Get distinct entity_type values for the filter dropdown. O(1).
 */
export async function listDistinctEntityTypes(): Promise<string[]> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadDistinctAuditEntityTypes(supabase)
}

export async function loadAdminAuditLogPage(
  params: ListAuditParams = {},
): Promise<AuditLogPageData> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAuditLogPageData(supabase, params)
}
