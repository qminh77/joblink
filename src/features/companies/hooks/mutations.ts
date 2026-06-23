"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  resubmitCompanyVerificationAction,
  updateJobStatusAction,
} from "../api/actions"
import type {
  ResubmitVerificationResult,
  UpdateStatusResult,
} from "../types"
import { translateDashboardError } from "./errors"

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
