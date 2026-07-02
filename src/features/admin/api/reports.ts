"use server"

// SRS UC Trace - M09 UC-66 Xu ly bao cao vi pham.
// Flow: /admin/reports -> reports panel -> admin report API -> reports moderation service/repo -> moderation action + audit.

import { createAdminClient } from "@/lib/supabase/admin"
import type { ReportStatus } from "@/types/database"

import { requireAdminAccess } from "./admin-guard"
import { revalidateAdminSection } from "./revalidation"
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
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAdminReports(supabase, params)
}

export async function setReportStatus(
  reportId: number,
  status: ReportStatus,
): Promise<AdminActionResult> {
  const parsed = reportStatusSchema.safeParse({ reportId, status })
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
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

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
  const result = await applyReportModeration(supabase, current, parsed.data)

  if (result.ok) revalidateAdminSection("reports")
  return result
}
