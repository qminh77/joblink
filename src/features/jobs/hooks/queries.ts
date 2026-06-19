"use client"

import { useQuery } from "@tanstack/react-query"

import type { JobsListPage, SavedJobsPage } from "../types"
import {
  JOBS_LIST_KEY,
  SAVED_JOBS_KEY,
  type JobsQueryParams,
} from "./keys"

export function useJobsList(params: JobsQueryParams) {
  return useQuery<JobsListPage>({
    queryKey: JOBS_LIST_KEY(params),
    queryFn: async () => {
      const { loadJobsListViaAction } = await import("../api/client-fetchers")
      return loadJobsListViaAction({
        search: params.search ?? null,
        provinceId: params.provinceId ?? null,
        jobTypeIds: params.jobTypeIds ?? null,
        workModeIds: params.workModeIds ?? null,
        salaryMin: params.salaryMin ?? null,
        companyUserId: params.companyUserId ?? null,
        offset: params.offset ?? 0,
        limit: params.limit ?? 20,
      })
    },
    initialData: params.initialData,
    staleTime: 15_000,
  })
}

export function useMySavedJobs(params?: {
  offset?: number
  limit?: number
  initialData?: SavedJobsPage
}) {
  const offset = params?.offset ?? 0
  return useQuery<SavedJobsPage>({
    queryKey: SAVED_JOBS_KEY(offset),
    queryFn: async () => {
      const { loadMySavedJobsViaAction } = await import(
        "../api/client-fetchers"
      )
      return loadMySavedJobsViaAction({
        offset,
        limit: params?.limit ?? 20,
      })
    },
    initialData: params?.initialData,
    staleTime: 15_000,
  })
}
