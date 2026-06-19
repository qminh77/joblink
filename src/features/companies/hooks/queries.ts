"use client"

import { useQuery } from "@tanstack/react-query"

import type {
  DashboardApplicantsPage,
  DashboardJobsPage,
} from "../types"
import {
  COMPANY_APPLICANTS_KEY,
  COMPANY_JOBS_KEY,
  type CompanyApplicantsParams,
  type CompanyJobsParams,
} from "./keys"

async function fetchJobsViaServer(
  params: CompanyJobsParams,
): Promise<DashboardJobsPage> {
  const { loadCompanyJobsPageViaAction } = await import("../api/client-fetchers")
  return loadCompanyJobsPageViaAction({
    status: params.status ?? "all",
    search: params.search ?? "",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  })
}

async function fetchApplicantsViaServer(
  params: CompanyApplicantsParams,
): Promise<DashboardApplicantsPage> {
  const { loadCompanyApplicantsPageViaAction } = await import(
    "../api/client-fetchers"
  )
  return loadCompanyApplicantsPageViaAction({
    jobId: params.jobId ?? null,
    status: params.status ?? "all",
    search: params.search ?? "",
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  })
}

export function useCompanyJobs(params: CompanyJobsParams) {
  const status = params.status ?? "all"
  const search = params.search ?? ""
  const offset = params.offset ?? 0
  return useQuery<DashboardJobsPage>({
    queryKey: COMPANY_JOBS_KEY(status, search, offset),
    queryFn: () => fetchJobsViaServer(params),
    initialData: params.initialData,
    staleTime: 15_000,
  })
}

export function useCompanyApplicants(params: CompanyApplicantsParams) {
  const jobId = params.jobId ?? null
  const status = params.status ?? "all"
  const search = params.search ?? ""
  const offset = params.offset ?? 0
  return useQuery<DashboardApplicantsPage>({
    queryKey: COMPANY_APPLICANTS_KEY(jobId, status, search, offset),
    queryFn: () => fetchApplicantsViaServer(params),
    initialData: params.initialData,
    staleTime: 15_000,
  })
}
