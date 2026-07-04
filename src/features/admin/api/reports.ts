"use server"

// SRS UC Trace - M09 UC-66 Xu ly bao cao vi pham.
// Flow: /admin/reports -> reports panel -> admin report API -> reports moderation service/repo -> moderation action + audit.

import type { ReportStatus } from "@/types/database"

import {
  requireAdminClient,
  requireAdminContext,
} from "../services/admin-context.service"
import { revalidateAdminSection } from "../services/admin-revalidation.service"
import {
  moderationActionSchema,
  reportStatusSchema,
  type ModerationActionInput,
} from "../schemas"
import {
  applyReportModeration,
  changeReportStatus,
  loadAdminReports,
} from "../services/reports.service"
import type {
  AdminActionResult,
  AdminReportRow,
  ListReportsParams,
} from "../types"

export type { ListReportsParams } from "../types"

export async function listAdminReports(
  params: ListReportsParams = {},
): Promise<AdminReportRow[]> {
  const supabase = await requireAdminClient()
  return loadAdminReports(supabase, params)
}

export async function setReportStatus(
  reportId: number,
  status: ReportStatus,
): Promise<AdminActionResult> {
  const parsed = reportStatusSchema.safeParse({ reportId, status })
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const { current, supabase } = await requireAdminContext()
  const result = await changeReportStatus(
    supabase,
    current,
    parsed.data.reportId,
    parsed.data.status,
  )

  if (result.ok) revalidateAdminSection("reports")
  return result
}

export async function applyModerationAction(
  input: ModerationActionInput,
): Promise<AdminActionResult> {
  const parsed = moderationActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const { current, supabase } = await requireAdminContext()
  const result = await applyReportModeration(supabase, current, parsed.data)

  if (result.ok) revalidateAdminSection("reports")
  return result
}
