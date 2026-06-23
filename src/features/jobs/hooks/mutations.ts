"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyToJobAction,
  toggleSavedJobAction,
  withdrawApplicationAction,
} from "../api/actions"
import type {
  ApplyResult,
  ToggleSavedResult,
  WithdrawResult,
} from "../types"
import { translateJobsError } from "./errors"

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
      const result = await applyToJobAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
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
      const result = await withdrawApplicationAction(applicationId)
      if (!result.ok) throw new Error(result.error)
      return result
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

export function useToggleSavedJob(options?: { onRollback?: () => void }) {
  const qc = useQueryClient()
  const te = useTranslations("jobs.errors")
  return useMutation<ToggleSavedResult, Error, number>({
    mutationFn: async (jobId) => {
      const result = await toggleSavedJobAction(jobId)
      if (!result.ok) throw new Error(result.error)
      return result
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
