"use server"

// SRS UC Trace - M09 UC-65 Kiem duyet tin tuyen dung.
// Flow: /admin/jobs -> jobs panel -> admin job API -> jobs moderation service/repo -> audit + revalidate.

import {
  requireAdminClient,
  requireAdminContext,
} from "../services/admin-context.service"
import { revalidateAdminSection } from "../services/admin-revalidation.service"
import { jobActionSchema, type JobActionInput } from "../schemas"
import {
  applyJobModerationAction,
  loadAdminJobs,
} from "../services/jobs.service"
import type { AdminActionResult, AdminJobRow, ListJobsParams } from "../types"

export type { AdminJobRow, ListJobsParams } from "../types"

export async function listAdminJobs(
  params: ListJobsParams = {},
): Promise<AdminJobRow[]> {
  const supabase = await requireAdminClient()
  return loadAdminJobs(supabase, params)
}

export async function applyJobAction(
  input: JobActionInput,
): Promise<AdminActionResult> {
  const parsed = jobActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const { current, supabase } = await requireAdminContext()
  const result = await applyJobModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("jobs")
  return result
}
