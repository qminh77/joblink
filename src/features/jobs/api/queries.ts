import "server-only"

import { createClient } from "@/lib/supabase/server"

import type {
  JobDetail,
  JobEditData,
  JobTypeRef,
  JobsListPage,
  MyApplicationsPage,
  SavedJobsPage,
  WorkModeRef,
} from "../types"

const EMPTY_JOBS: JobsListPage = { items: [], total: 0 }
const EMPTY_SAVED: SavedJobsPage = { items: [], total: 0 }
const EMPTY_APPLICATIONS: MyApplicationsPage = { items: [], total: 0 }

export type JobsListFilters = {
  search?: string | null
  provinceId?: number | null
  jobTypeIds?: number[] | null
  workModeIds?: number[] | null
  salaryMin?: number | null
  companyUserId?: number | null
  limit?: number
  offset?: number
}

export async function loadJobsList(
  filters: JobsListFilters = {},
): Promise<JobsListPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_jobs_list", {
    p_search: filters.search ?? null,
    p_province_id: filters.provinceId ?? null,
    p_job_type_ids:
      filters.jobTypeIds && filters.jobTypeIds.length > 0
        ? filters.jobTypeIds
        : null,
    p_work_mode_ids:
      filters.workModeIds && filters.workModeIds.length > 0
        ? filters.workModeIds
        : null,
    p_salary_min: filters.salaryMin ?? null,
    p_company_user_id: filters.companyUserId ?? null,
    p_limit: filters.limit ?? 20,
    p_offset: filters.offset ?? 0,
  })
  if (error) {
    console.error(
      "[loadJobsList] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_JOBS
  }
  if (!data) return EMPTY_JOBS
  return data as unknown as JobsListPage
}

export async function loadJobDetail(jobId: number): Promise<JobDetail | null> {
  if (!Number.isInteger(jobId) || jobId <= 0) return null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_job_detail", {
    p_job_id: jobId,
  })
  if (error) {
    console.error(
      "[loadJobDetail] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }
  if (!data) return null
  return data as unknown as JobDetail
}

// Owner-only: RPC trả NULL nếu không phải chủ tin → route tự notFound.
export async function loadJobForEdit(
  jobId: number,
): Promise<JobEditData | null> {
  if (!Number.isInteger(jobId) || jobId <= 0) return null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_job_for_edit", {
    p_job_id: jobId,
  })
  if (error) {
    console.error(
      "[loadJobForEdit] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }
  if (!data) return null
  return data as unknown as JobEditData
}

export async function loadMySavedJobs(options?: {
  limit?: number
  offset?: number
}): Promise<SavedJobsPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_my_saved_jobs", {
    p_limit: options?.limit ?? 20,
    p_offset: options?.offset ?? 0,
  })
  if (error) {
    console.error(
      "[loadMySavedJobs] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_SAVED
  }
  if (!data) return EMPTY_SAVED
  return data as unknown as SavedJobsPage
}

export async function loadMyApplications(options?: {
  limit?: number
  offset?: number
}): Promise<MyApplicationsPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_my_applications", {
    p_limit: options?.limit ?? 30,
    p_offset: options?.offset ?? 0,
  })
  if (error) {
    console.error(
      "[loadMyApplications] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_APPLICATIONS
  }
  if (!data) return EMPTY_APPLICATIONS
  return data as unknown as MyApplicationsPage
}

// ---------------------------------------------------------------------------
// Reference data: cache theo request (Next 16 dedupe trong cùng render).
// ---------------------------------------------------------------------------
export async function loadJobTypes(): Promise<JobTypeRef[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("job_types")
    .select("id, code, name")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    
  if (error) {
    console.error("SUPABASE JOB TYPES ERROR:", error)
  }
  return (data ?? []) as JobTypeRef[]
}

export async function loadWorkModes(): Promise<WorkModeRef[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_modes")
    .select("id, code, name")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    
  if (error) {
    console.error("SUPABASE WORK MODES ERROR:", error)
  }
  return (data ?? []) as WorkModeRef[]
}

