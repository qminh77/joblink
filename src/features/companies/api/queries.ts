import "server-only"

import { createClient } from "@/lib/supabase/server"

import type {
  CompanyPublicOverview,
  DashboardApplicantsPage,
  DashboardJobsPage,
  DashboardOverview,
  JobStatusFilter,
} from "../types"

const DEFAULT_JOBS_LIMIT = 8

/**
 * Load full data for /company/[id] in 1 RPC round-trip. Returns null khi
 * công ty không tồn tại / bị khoá / role không phải company.
 */
export async function loadCompanyPublicOverview(
  companyUserId: number,
  options?: { jobsLimit?: number },
): Promise<CompanyPublicOverview | null> {
  if (!Number.isInteger(companyUserId) || companyUserId <= 0) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_company_public_overview", {
    p_company_user_id: companyUserId,
    p_jobs_limit: options?.jobsLimit ?? DEFAULT_JOBS_LIMIT,
  })

  if (error) {
    console.error(
      "[loadCompanyPublicOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }

  if (!data) return null
  return data as unknown as CompanyPublicOverview
}

// ---------------------------------------------------------------------------
// Dashboard (owner-only)
// ---------------------------------------------------------------------------
const EMPTY_JOBS: DashboardJobsPage = { items: [], total: 0 }
const EMPTY_APPS: DashboardApplicantsPage = { items: [], total: 0 }

/**
 * Trả NULL nếu viewer không phải role 'company' — page sẽ notFound(). RPC tự
 * check role nên action không cần check trùng.
 */
export async function loadCompanyDashboardOverview(): Promise<DashboardOverview | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_company_dashboard_overview")
  if (error) {
    console.error(
      "[loadCompanyDashboardOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }
  if (!data) return null
  return data as unknown as DashboardOverview
}

export async function loadCompanyJobsPage(options?: {
  status?: JobStatusFilter
  search?: string | null
  limit?: number
  offset?: number
}): Promise<DashboardJobsPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_company_jobs", {
    p_status: options?.status ?? "all",
    p_search: options?.search ?? null,
    p_limit: options?.limit ?? 20,
    p_offset: options?.offset ?? 0,
  })
  if (error) {
    console.error(
      "[loadCompanyJobsPage] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_JOBS
  }
  if (!data) return EMPTY_JOBS
  return data as unknown as DashboardJobsPage
}

export async function loadCompanyApplicantsPage(options?: {
  jobId?: number | null
  status?: string
  search?: string | null
  limit?: number
  offset?: number
}): Promise<DashboardApplicantsPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_company_applicants", {
    p_job_id: options?.jobId ?? null,
    p_status: options?.status ?? "all",
    p_search: options?.search ?? null,
    p_limit: options?.limit ?? 50,
    p_offset: options?.offset ?? 0,
  })
  if (error) {
    console.error(
      "[loadCompanyApplicantsPage] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return EMPTY_APPS
  }
  if (!data) return EMPTY_APPS
  return data as unknown as DashboardApplicantsPage
}

