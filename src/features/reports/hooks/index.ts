"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createReportAction } from "../api/actions"
import {
  loadReportReasons,
  type ReportReasonOption,
} from "../lib/report-reasons"
import type { CreateReportInput } from "../types"

export function useReportReasons() {
  return useQuery<ReportReasonOption[]>({
    queryKey: ["report-reasons"],
    queryFn: loadReportReasons,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateReport() {
  const t = useTranslations("reports")
  return useMutation({
    mutationFn: async (input: CreateReportInput) => {
      const result = await createReportAction({
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description,
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      toast.success(t("submitReport"))
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
