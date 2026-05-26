"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { JobStatus } from "@/lib/constants"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { jobActionSchema, type JobActionInput } from "../schemas"

export type AdminJobRow = {
  id: number
  title: string
  status: JobStatus
  companyUserId: number
  companyName: string
  applicationsCount: number
  createdAt: string
  expiresAt: string | null
}

export type ListJobsParams = {
  search?: string
  status?: JobStatus | "all"
  limit?: number
}

export async function listAdminJobs(
  params: ListJobsParams = {},
): Promise<AdminJobRow[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("jobs")
    .select(
      "id, title, status, company_user_id, created_at, expires_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }
  if (params.search?.trim()) {
    query = query.ilike("title", `%${params.search.trim()}%`)
  }

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: number
    title: string
    status: JobStatus
    company_user_id: number
    created_at: string
    expires_at: string | null
  }>

  const companyIds = [...new Set(rows.map((r) => r.company_user_id))]
  const jobIds = rows.map((r) => r.id)
  const companyMap: Record<number, string> = {}
  const appsMap: Record<number, number> = {}

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("user_id, name")
      .in("user_id", companyIds)
    for (const c of (companies ?? []) as Array<{
      user_id: number
      name: string
    }>) {
      companyMap[c.user_id] = c.name
    }
  }
  if (jobIds.length > 0) {
    const { data: apps } = await supabase
      .from("job_applications")
      .select("job_id")
      .in("job_id", jobIds)
    for (const row of (apps ?? []) as Array<{ job_id: number }>) {
      appsMap[row.job_id] = (appsMap[row.job_id] ?? 0) + 1
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    companyUserId: r.company_user_id,
    companyName: companyMap[r.company_user_id] ?? `company#${r.company_user_id}`,
    applicationsCount: appsMap[r.id] ?? 0,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }))
}

export async function applyJobAction(
  input: JobActionInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = jobActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("jobs")
    .select("id, status, title, company_user_id")
    .eq("id", parsed.data.jobId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: number
      status: JobStatus
      title: string
      company_user_id: number
    }>()
  if (!target) return { ok: false, error: "not_found" }

  const newStatus: JobStatus =
    parsed.data.action === "remove" ? "removed" : "active"

  const { error } = await supabase
    .from("jobs")
    .update({ status: newStatus } as never)
    .eq("id", parsed.data.jobId)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `job.${parsed.data.action}`,
    entityType: "jobs",
    entityId: parsed.data.jobId,
    oldData: { status: target.status, title: target.title },
    newData: { status: newStatus },
    reason: parsed.data.reason,
  })

  revalidatePath("/admin/jobs")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}
