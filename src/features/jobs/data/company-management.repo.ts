import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { JobApplicationRow, JobRow } from "@/types/database"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type CompanyJobRecord = Pick<
  JobRow,
  | "id"
  | "title"
  | "status"
  | "created_at"
  | "updated_at"
  | "expires_at"
  | "salary_min"
  | "salary_max"
  | "salary_visible"
  | "job_type_id"
  | "work_mode_id"
  | "province_id"
  | "ward_id"
>

export type CompanyApplicationRecord = Pick<
  JobApplicationRow,
  | "id"
  | "job_id"
  | "applicant_id"
  | "resume_url"
  | "cover_letter"
  | "status"
  | "applied_at"
  | "updated_at"
>

export type RefNameRecord = { id: number; name: string }
export type MemberProfileRecord = {
  user_id: number
  full_name: string
  avatar_url: string | null
  headline: string | null
}

export type CompanyJobFilters = {
  status?: JobRow["status"] | "all"
  search?: string | null
  limit?: number
  offset?: number
}

export type CompanyApplicationFilters = {
  jobId?: number | null
  status?: JobApplicationRow["status"] | "all"
  limit?: number
  offset?: number
}

export async function listCompanyJobRows(
  supabase: Supabase,
  companyUserId: number,
  filters: CompanyJobFilters = {},
) {
  const limit = Math.min(200, Math.max(1, filters.limit ?? 50))
  const offset = Math.max(0, filters.offset ?? 0)

  let query = supabase
    .from("jobs")
    .select(
      "id, title, status, created_at, updated_at, expires_at, salary_min, salary_max, salary_visible, job_type_id, work_mode_id, province_id, ward_id",
      { count: "exact" },
    )
    .eq("company_user_id", companyUserId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }
  if (filters.search?.trim()) {
    query = query.ilike("title", `%${filters.search.trim()}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  return { rows: (data ?? []) as CompanyJobRecord[], error, count: count ?? 0 }
}

export async function listCompanyApplicationRows(
  supabase: Supabase,
  jobIds: number[],
  filters: CompanyApplicationFilters = {},
) {
  if (jobIds.length === 0) {
    return { rows: [] as CompanyApplicationRecord[], error: null, count: 0 }
  }

  const limit = Math.min(200, Math.max(1, filters.limit ?? 50))
  const offset = Math.max(0, filters.offset ?? 0)
  const scopedJobIds = filters.jobId ? [filters.jobId] : jobIds

  let query = supabase
    .from("job_applications")
    .select(
      "id, job_id, applicant_id, resume_url, cover_letter, status, applied_at, updated_at",
      { count: "exact" },
    )
    .in("job_id", scopedJobIds)
    .order("applied_at", { ascending: false })

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  return {
    rows: (data ?? []) as CompanyApplicationRecord[],
    error,
    count: count ?? 0,
  }
}

export async function listCompanyJobApplicationCounts(
  supabase: Supabase,
  jobIds: number[],
) {
  if (jobIds.length === 0) return [] as { job_id: number; count: number }[]
  const { data } = await supabase.rpc("count_applications_per_job", {
    p_job_ids: jobIds,
  })
  return (data ?? []) as { job_id: number; count: number }[]
}

export async function countApplicationsForJobs(
  supabase: Supabase,
  jobIds: number[],
  status?: JobApplicationRow["status"],
) {
  if (jobIds.length === 0) return 0
  let query = supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .in("job_id", jobIds)
  if (status) query = query.eq("status", status)
  const { count } = await query
  return count ?? 0
}

export async function listJobTypeNames(supabase: Supabase, ids: number[]) {
  if (ids.length === 0) return [] as RefNameRecord[]
  const { data } = await supabase.from("job_types").select("id, name").in("id", ids)
  return (data ?? []) as RefNameRecord[]
}

export async function listWorkModeNames(supabase: Supabase, ids: number[]) {
  if (ids.length === 0) return [] as RefNameRecord[]
  const { data } = await supabase.from("work_modes").select("id, name").in("id", ids)
  return (data ?? []) as RefNameRecord[]
}

export async function listProvinceNames(supabase: Supabase, ids: number[]) {
  if (ids.length === 0) return [] as RefNameRecord[]
  const { data } = await supabase.from("provinces").select("id, name").in("id", ids)
  return (data ?? []) as RefNameRecord[]
}

export async function listWardNames(supabase: Supabase, ids: number[]) {
  if (ids.length === 0) return [] as RefNameRecord[]
  const { data } = await supabase.from("wards").select("id, name").in("id", ids)
  return (data ?? []) as RefNameRecord[]
}

export async function listApplicantProfiles(
  supabase: Supabase,
  userIds: number[],
) {
  if (userIds.length === 0) return [] as MemberProfileRecord[]
  const { data } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline")
    .in("user_id", userIds)
    .is("deleted_at", null)
  return (data ?? []) as MemberProfileRecord[]
}
