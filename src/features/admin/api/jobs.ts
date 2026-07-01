"use server"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
import { revalidateAdminSection } from "./revalidation"
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
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAdminJobs(supabase, params)
}

export async function applyJobAction(
  input: JobActionInput,
): Promise<AdminActionResult> {
  const parsed = jobActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
  const result = await applyJobModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("jobs")
  return result
}
