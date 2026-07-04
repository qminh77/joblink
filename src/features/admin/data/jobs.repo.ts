import "server-only"

import type { JobStatus } from "@/features/jobs/lib/constants"
import type { createAdminClient } from "@/lib/supabase/admin"

import type { ListJobsParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AdminJobRecord = {
  id: number
  title: string
  status: JobStatus
  company_user_id: number
  created_at: string
  expires_at: string | null
}

export type AdminJobCompanyRow = {
  user_id: number
  name: string
}

export type AdminJobApplicationCountRow = {
  job_id: number
  count: number
}

export type AdminJobTargetRecord = {
  id: number
  status: JobStatus
  title: string
  company_user_id: number
}

export async function listAdminJobRows(
  supabase: AdminSupabase,
  params: ListJobsParams,
) {
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("jobs")
    .select("id, title, status, company_user_id, created_at, expires_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }
  if (params.search?.trim()) {
    query = query.ilike("title", `%${params.search.trim()}%`)
  }

  const { data, error } = await query
  return { rows: (data ?? []) as AdminJobRecord[], error }
}

export async function listAdminJobCompanies(
  supabase: AdminSupabase,
  companyIds: number[],
): Promise<AdminJobCompanyRow[]> {
  if (companyIds.length === 0) return []
  const { data } = await supabase
    .from("company_profiles")
    .select("user_id, name")
    .in("user_id", companyIds)
  return (data ?? []) as AdminJobCompanyRow[]
}

export async function listAdminJobApplicationCounts(
  supabase: AdminSupabase,
  jobIds: number[],
): Promise<AdminJobApplicationCountRow[]> {
  if (jobIds.length === 0) return []
  const { data } = await supabase.rpc("count_applications_per_job", {
    p_job_ids: jobIds,
  })
  return (data ?? []) as AdminJobApplicationCountRow[]
}

export function getAdminJobTarget(supabase: AdminSupabase, jobId: number) {
  return supabase
    .from("jobs")
    .select("id, status, title, company_user_id")
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle<AdminJobTargetRecord>()
}

export function updateAdminJobStatus(
  supabase: AdminSupabase,
  jobId: number,
  status: JobStatus,
) {
  return supabase.from("jobs").update({ status } as never).eq("id", jobId)
}
