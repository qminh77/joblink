import type {
  DashboardApplicantsPage,
  DashboardJobsPage,
} from "../types"

export const COMPANY_JOBS_KEY = (
  status: string,
  search: string,
  offset: number,
) => ["companies", "dashboard", "jobs", status, search, offset] as const

export const COMPANY_APPLICANTS_KEY = (
  jobId: number | null,
  status: string,
  search: string,
  offset: number,
) =>
  [
    "companies",
    "dashboard",
    "applicants",
    jobId ?? "all",
    status,
    search,
    offset,
  ] as const

export const COMPANY_DASHBOARD_OVERVIEW_KEY = [
  "companies",
  "dashboard",
  "overview",
] as const

export type CompanyJobsParams = {
  status?: string
  search?: string
  limit?: number
  offset?: number
  initialData?: DashboardJobsPage
}

export type CompanyApplicantsParams = {
  jobId?: number | null
  status?: string
  search?: string
  limit?: number
  offset?: number
  initialData?: DashboardApplicantsPage
}
