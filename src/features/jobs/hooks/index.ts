"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyToJobAction,
  respondInterviewAction,
  toggleSavedJobAction,
  withdrawApplicationAction,
} from "../api/actions"
import type {
  ApplyResult,
  JobsListPage,
  RespondInterviewResult,
  SavedJobsPage,
  ToggleSavedResult,
  WithdrawResult,
} from "../types"

const KNOWN_ERRORS = new Set([
  "unauthorized",
  "memberOnly",
  "notCompany",
  "companyInactive",
  "jobNotFound",
  "jobNotActive",
  "jobExpired",
  "alreadyApplied",
  "coverLetterTooLong",
  "invalidJob",
  "invalidApplication",
  "applicationNotFound",
  "notOwner",
  "cannotWithdrawNow",
  "invalidTitle",
  "titleTooLong",
  "invalidDescription",
  "invalidSalaryRange",
  "invalidStatus",
  "invalidJobType",
  "invalidWorkMode",
  "invalidProvince",
  "invalidResumeUrl",
  "tooManySkills",
  "titleRequired",
  "descriptionRequired",
  "descriptionTooLong",
  "requirementsTooLong",
  "jobTypeRequired",
  "workModeRequired",
  "interviewNotFound",
  "unknown",
])

function translateJobsError(t: (k: string) => string, raw: string) {
  if (!raw) return t("unknown")
  if (KNOWN_ERRORS.has(raw)) return t(raw)
  return raw
}

// ---------------------------------------------------------------------------
// Queries via server-action (giữ auth context)
// ---------------------------------------------------------------------------
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

export const JOBS_LIST_KEY = (p: JobsQueryParams) =>
  [
    "jobs",
    "list",
    p.search ?? "",
    p.provinceId ?? "any",
    (p.jobTypeIds ?? []).join(","),
    (p.workModeIds ?? []).join(","),
    p.salaryMin ?? "any",
    p.companyUserId ?? "any",
    p.offset ?? 0,
  ] as const

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

export const SAVED_JOBS_KEY = (offset: number) =>
  ["jobs", "saved", offset] as const

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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useApplyToJob() {
  const qc = useQueryClient()
  const tu = useTranslations("jobs.public")
  const te = useTranslations("jobs.errors")

  return useMutation<
    ApplyResult,
    Error,
    { jobId: number; coverLetter?: string | null; resumeCvId: number }
  >({
    mutationFn: async (input) => {
      const r = await applyToJobAction(input)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: () => {
      toast.success(tu("applySuccess"))
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      toast.error(translateJobsError(te, error.message))
    },
  })
}

export function useWithdrawApplication() {
  const qc = useQueryClient()
  const tu = useTranslations("jobs.public")
  const te = useTranslations("jobs.errors")

  return useMutation<WithdrawResult, Error, number>({
    mutationFn: async (applicationId) => {
      const r = await withdrawApplicationAction(applicationId)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: () => {
      toast.success(tu("withdrawSuccess"))
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      toast.error(translateJobsError(te, error.message))
    },
  })
}

export function useRespondInterview() {
  const qc = useQueryClient()
  const tu = useTranslations("jobs.applications")
  const te = useTranslations("jobs.errors")

  return useMutation<
    RespondInterviewResult,
    Error,
    { interviewId: number; accept: boolean }
  >({
    mutationFn: async (input) => {
      const r = await respondInterviewAction(input)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: (result) => {
      if (!result.ok) return
      toast.success(
        result.status === "confirmed"
          ? tu("interviewConfirmedToast")
          : tu("interviewDeclinedToast"),
      )
      qc.invalidateQueries({ queryKey: ["jobs", "applications"] })
    },
    onError: (error) => {
      toast.error(translateJobsError(te, error.message))
    },
  })
}

export function useToggleSavedJob(options?: {
  onRollback?: () => void
}) {
  const qc = useQueryClient()
  const te = useTranslations("jobs.errors")
  return useMutation<ToggleSavedResult, Error, number>({
    mutationFn: async (jobId) => {
      const r = await toggleSavedJobAction(jobId)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      options?.onRollback?.()
      toast.error(translateJobsError(te, error.message))
    },
  })
}
