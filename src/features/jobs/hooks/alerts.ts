"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createJobAlertAction,
  deleteJobAlertAction,
  listJobAlertsAction,
} from "../api/alert-actions"
import type { JobAlert, JobAlertFilters } from "../types"
import { JOB_ALERTS_KEY } from "./keys"

export function useJobAlerts() {
  return useQuery<JobAlert[]>({
    queryKey: JOB_ALERTS_KEY,
    queryFn: listJobAlertsAction,
    staleTime: 30_000,
  })
}

export function useCreateJobAlert() {
  const qc = useQueryClient()
  const t = useTranslations("jobs.alerts")
  return useMutation({
    mutationFn: async (input: {
      name?: string | null
      filters: JobAlertFilters
    }) => {
      const result = await createJobAlertAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success(t("created"))
      qc.invalidateQueries({ queryKey: JOB_ALERTS_KEY })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteJobAlert() {
  const qc = useQueryClient()
  const t = useTranslations("jobs.alerts")
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await deleteJobAlertAction(id)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: JOB_ALERTS_KEY })
      const prev = qc.getQueryData<JobAlert[]>(JOB_ALERTS_KEY)
      qc.setQueryData<JobAlert[]>(JOB_ALERTS_KEY, (old) =>
        (old ?? []).filter((alert) => alert.id !== id),
      )
      return { prev }
    },
    onError: (error: Error, _id, context) => {
      if (context?.prev) qc.setQueryData(JOB_ALERTS_KEY, context.prev)
      toast.error(error.message)
    },
    onSuccess: () => toast.success(t("deleted")),
    onSettled: () => qc.invalidateQueries({ queryKey: JOB_ALERTS_KEY }),
  })
}
