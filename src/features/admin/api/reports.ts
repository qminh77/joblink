"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ReportStatus } from "@/types/database"

import { requireAdmin } from "./admin-guard"
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
  await requireAdmin()
  const supabase = createAdminClient()
  return loadAdminReports(supabase, params)
}

export async function setReportStatus(
  reportId: number,
  status: ReportStatus,
): Promise<AdminActionResult> {
  const parsed = reportStatusSchema.safeParse({ reportId, status })
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()
  const result = await changeReportStatus(
    supabase,
    current,
    parsed.data.reportId,
    parsed.data.status,
  )

  if (result.ok) revalidateAdminReportViews()
  return result
}

export async function applyModerationAction(
  input: ModerationActionInput,
): Promise<AdminActionResult> {
  const parsed = moderationActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()
  const result = await applyReportModeration(supabase, current, parsed.data)

  if (result.ok) revalidateAdminReportViews()
  return result
}

function revalidateAdminReportViews() {
  revalidatePath("/admin/reports")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
}
