"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  resubmitCompanyVerificationAction,
  scheduleInterviewAction,
  updateApplicationStatusAction,
  updateJobStatusAction,
} from "../api/actions"
import type { ScheduleInterviewInput } from "../schemas"
import type {
  ResubmitVerificationResult,
  ScheduleInterviewResult,
  UpdateStatusResult,
} from "../types"
import { translateDashboardError } from "./errors"

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
      const result = await updateApplicationStatusAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
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
      const result = await scheduleInterviewAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
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
      const result = await resubmitCompanyVerificationAction()
      if (!result.ok) throw new Error(result.error)
      return result
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
      const result = await updateJobStatusAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
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
