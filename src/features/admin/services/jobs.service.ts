import "server-only"

import type { JobStatus } from "@/lib/constants"
import type { createAdminClient } from "@/lib/supabase/admin"

import { writeAuditLog } from "../api/audit-log"
import type { JobActionInput } from "../schemas"
import {
  getAdminJobTarget,
  listAdminJobApplicationCounts,
  listAdminJobCompanies,
  listAdminJobRows,
  updateAdminJobStatus,
  type AdminJobRecord,
} from "../data/jobs.repo"
import type { AdminActionResult, AdminJobRow, ListJobsParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

type AdminActor = {
  appUser: { id: number }
}

export async function loadAdminJobs(
  supabase: AdminSupabase,
  params: ListJobsParams = {},
): Promise<AdminJobRow[]> {
  const { rows, error } = await listAdminJobRows(supabase, params)
  if (error) return []

  const [companyMap, applicationMap] = await Promise.all([
    buildJobCompanyMap(supabase, rows),
    buildJobApplicationMap(supabase, rows),
  ])

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    companyUserId: row.company_user_id,
    companyName:
      companyMap[row.company_user_id] ?? `company#${row.company_user_id}`,
    applicationsCount: applicationMap[row.id] ?? 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }))
}

export async function applyJobModerationAction(
  supabase: AdminSupabase,
  actor: AdminActor,
  input: JobActionInput,
): Promise<AdminActionResult> {
  const { data: target } = await getAdminJobTarget(supabase, input.jobId)
  if (!target) return { ok: false, error: "not_found" }

  const newStatus = jobActionStatus(input.action)
  const { error } = await updateAdminJobStatus(supabase, input.jobId, newStatus)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `job.${input.action}`,
    entityType: "jobs",
    entityId: input.jobId,
    oldData: { status: target.status, title: target.title },
    newData: { status: newStatus },
    reason: input.reason,
  })

  return { ok: true }
}

async function buildJobCompanyMap(
  supabase: AdminSupabase,
  rows: AdminJobRecord[],
) {
  const companyIds = [...new Set(rows.map((row) => row.company_user_id))]
  const companies = await listAdminJobCompanies(supabase, companyIds)
  const companyMap: Record<number, string> = {}

  for (const company of companies) {
    companyMap[company.user_id] = company.name
  }

  return companyMap
}

async function buildJobApplicationMap(
  supabase: AdminSupabase,
  rows: AdminJobRecord[],
) {
  const jobIds = rows.map((row) => row.id)
  const appCounts = await listAdminJobApplicationCounts(supabase, jobIds)
  const appMap: Record<number, number> = {}

  for (const row of appCounts) {
    appMap[row.job_id] = row.count
  }

  return appMap
}

function jobActionStatus(action: JobActionInput["action"]): JobStatus {
  return action === "remove" ? "removed" : "active"
}
