"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { getReportTypesAction, createReportAction } from "../api/actions"
import type { ReportTypeOption } from "../api/actions"
import type { CreateReportInput } from "../types"

export function useReportTypes() {
  return useQuery<ReportTypeOption[]>({
    queryKey: ["report-types"],
    queryFn: getReportTypesAction,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateReport() {
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
      toast.success("Đã gửi báo cáo")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
