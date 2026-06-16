"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { createReportAction } from "../api/actions"
import type { ReportTypeOption } from "../api/actions"
import {
  getMyAppealsOverviewAction,
  submitAppealAction,
} from "../api/appeals-actions"
import type { CreateReportInput, MyModerationAction } from "../types"

export const MY_APPEALS_KEY = ["appeals", "mine"] as const

export function useReportTypes() {
  return useQuery<ReportTypeOption[]>({
    queryKey: ["report-types"],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("report_types")
        .select("id, code, name, name_en")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (error) throw error

      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        code: r.code as string,
        name: r.name as string,
        nameEn: (r.name_en as string | null) ?? null,
      })) as ReportTypeOption[]
    },
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

// ── Khiếu nại (UC-71) ────────────────────────────────────────────────────────

export function useMyAppeals() {
  return useQuery<MyModerationAction[]>({
    queryKey: MY_APPEALS_KEY,
    queryFn: getMyAppealsOverviewAction,
    staleTime: 30_000,
  })
}

export function useSubmitAppeal() {
  const t = useTranslations("reports.appeal")
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      moderationActionId: number
      reason: string
    }) => {
      const result = await submitAppealAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: () => {
      toast.success(t("submitted"))
      queryClient.invalidateQueries({ queryKey: MY_APPEALS_KEY })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
