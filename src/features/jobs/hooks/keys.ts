import type { JobsListPage } from "../types"

export type JobsQueryParams = {
  search?: string
  provinceId?: number | null
  jobTypeIds?: number[]
  workModeIds?: number[]
  salaryMin?: number | null
  companyUserId?: number | null
  offset?: number
  limit?: number
  initialData?: JobsListPage
}

export const JOBS_LIST_KEY = (params: JobsQueryParams) =>
  [
    "jobs",
    "list",
    params.search ?? "",
    params.provinceId ?? "any",
    (params.jobTypeIds ?? []).join(","),
    (params.workModeIds ?? []).join(","),
    params.salaryMin ?? "any",
    params.companyUserId ?? "any",
    params.offset ?? 0,
  ] as const

export const SAVED_JOBS_KEY = (offset: number) =>
  ["jobs", "saved", offset] as const

export const JOB_ALERTS_KEY = ["jobs", "alerts"] as const
