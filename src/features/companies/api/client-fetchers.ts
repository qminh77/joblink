"use server"

// Wrapper server actions cho phép client gọi paginated queries qua React Query.
// Server actions tự run trong session của user, RPC check role/ownership.

import {
  loadCompanyApplicantsPage,
  loadCompanyJobsPage,
} from "./queries"
import type {
  DashboardApplicantsPage,
  DashboardJobsPage,
  JobStatusFilter,
} from "../types"

export async function loadCompanyJobsPageViaAction(input: {
  status: string
  search: string
  limit: number
  offset: number
}): Promise<DashboardJobsPage> {
  return loadCompanyJobsPage({
    status: input.status as JobStatusFilter,
    search: input.search || null,
    limit: input.limit,
    offset: input.offset,
  })
}

export async function loadCompanyApplicantsPageViaAction(input: {
  jobId: number | null
  status: string
  search: string
  limit: number
  offset: number
}): Promise<DashboardApplicantsPage> {
  return loadCompanyApplicantsPage({
    jobId: input.jobId,
    status: input.status,
    search: input.search || null,
    limit: input.limit,
    offset: input.offset,
  })
}
