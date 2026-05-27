"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  resubmitCompanyVerificationAction,
  scheduleInterviewAction,
  toggleFollowCompanyAction,
  updateApplicationStatusAction,
  updateJobStatusAction,
} from "../api/actions"
import type { ScheduleInterviewInput } from "../schemas"
import type {
  DashboardApplicantsPage,
  DashboardJobsPage,
  ResubmitVerificationResult,
  ScheduleInterviewResult,
  ToggleFollowResult,
  UpdateStatusResult,
} from "../types"

const KNOWN_ERRORS = new Set([
  "invalidCompany",
  "unauthorized",
  "selfFollow",
  "companyNotFound",
  "notCompany",
  "companyInactive",
  "unknown",
])

function translateFollowError(
  t: (k: string) => string,
  raw: string | undefined,
) {
  if (!raw) return t("unknown")
  if (KNOWN_ERRORS.has(raw)) return t(raw)
  return raw
}

/**
 * Toggle follow một công ty. Component cha quản lý state hiển thị (count +
 * isFollowing) bằng useState; mutation chỉ gọi server, on error rollback ở
 * component cha qua callback `onRollback`.
 */
export function useToggleFollowCompany(options?: {
  onRollback?: () => void
}) {
  const te = useTranslations("companies.errors")

  return useMutation<ToggleFollowResult, Error, number>({
    mutationFn: async (companyUserId) => {
      const result = await toggleFollowCompanyAction(companyUserId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onError: (error) => {
      options?.onRollback?.()
      toast.error(translateFollowError(te, error.message))
    },
  })
}

// ---------------------------------------------------------------------------
// Dashboard queries (client-side refetch sau mutation; SSR seed initialData)
// ---------------------------------------------------------------------------
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

type JobsParams = {
  status?: string
  search?: string
  limit?: number
  offset?: number
  initialData?: DashboardJobsPage
}

type ApplicantsParams = {
  jobId?: number | null
  status?: string
  search?: string
  limit?: number
  offset?: number
  initialData?: DashboardApplicantsPage
}

/**
 * Fetch jobs page qua action (server-side path để bảo toàn auth context).
 * Client-side gọi action thay vì supabase-js để recruiter không phải nhúng
 * anon key tự gọi RPC — và RPC vẫn check role server-side.
 */
async function fetchJobsViaServer(params: JobsParams): Promise<DashboardJobsPage> {
  const { loadCompanyJobsPageViaAction } = await import("../api/client-fetchers")
  return loadCompanyJobsPageViaAction({
    status: params.status ?? "all",
    search: params.search ?? "",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  })
}

async function fetchApplicantsViaServer(
  params: ApplicantsParams,
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

export function useCompanyJobs(params: JobsParams) {
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

export function useCompanyApplicants(params: ApplicantsParams) {
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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
function translateDashboardError(t: (k: string) => string, raw: string) {
  const known = new Set([
    "unauthorized",
    "invalidStatus",
    "applicationNotFound",
    "notOwner",
    "cannotWithdraw",
    "invalidApplication",
    "invalidJob",
    "jobNotFound",
    "jobRemoved",
    "noteTooLong",
    "invalidScheduleTime",
    "invalidDuration",
    "locationTooLong",
    "cannotSchedule",
    "interviewNotFound",
    "notResubmittable",
    "companyNotFound",
    "notCompany",
    "unknown",
  ])
  if (!raw) return t("unknown")
  if (known.has(raw)) return t(raw)
  return raw
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient()
  const te = useTranslations("companies.dashboardErrors")
  const ts = useTranslations("companies.dashboard")

  return useMutation<
    UpdateStatusResult,
    Error,
    { applicationId: number; newStatus: string; note?: string | null }
  >({
    mutationFn: async (input) => {
      const r = await updateApplicationStatusAction(input)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: (result) => {
      if (!result.ok || result.noop) return
      toast.success(ts("statusUpdated"))
      qc.invalidateQueries({ queryKey: ["companies", "dashboard"] })
    },
    onError: (error) => {
      toast.error(translateDashboardError(te, error.message))
    },
  })
}

export function useScheduleInterview() {
  const qc = useQueryClient()
  const te = useTranslations("companies.dashboardErrors")
  const ts = useTranslations("companies.dashboard")

  return useMutation<ScheduleInterviewResult, Error, ScheduleInterviewInput>({
    mutationFn: async (input) => {
      const r = await scheduleInterviewAction(input)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: () => {
      toast.success(ts("interviewScheduled"))
      qc.invalidateQueries({ queryKey: ["companies", "dashboard"] })
    },
    onError: (error) => {
      toast.error(translateDashboardError(te, error.message))
    },
  })
}

export function useResubmitVerification() {
  const te = useTranslations("companies.dashboardErrors")
  const ts = useTranslations("companies.verification")

  return useMutation<ResubmitVerificationResult, Error, void>({
    mutationFn: async () => {
      const r = await resubmitCompanyVerificationAction()
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: () => {
      toast.success(ts("resubmitSuccess"))
    },
    onError: (error) => {
      toast.error(translateDashboardError(te, error.message))
    },
  })
}

export function useUpdateJobStatus() {
  const qc = useQueryClient()
  const te = useTranslations("companies.dashboardErrors")
  const ts = useTranslations("companies.dashboard")

  return useMutation<
    UpdateStatusResult,
    Error,
    { jobId: number; newStatus: string }
  >({
    mutationFn: async (input) => {
      const r = await updateJobStatusAction(input)
      if (!r.ok) throw new Error(r.error)
      return r
    },
    onSuccess: (result) => {
      if (!result.ok || result.noop) return
      toast.success(ts("jobStatusUpdated"))
      qc.invalidateQueries({ queryKey: ["companies", "dashboard"] })
    },
    onError: (error) => {
      toast.error(translateDashboardError(te, error.message))
    },
  })
}
