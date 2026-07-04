"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyModerationAction,
  setReportStatus,
} from "../../api/reports"
import type { AdminReportRow } from "../../types"
import type { ReportStatus } from "@/features/reports/lib/constants"
import type { ModerationActionType } from "@/types/database"

export function useReportsPanel() {
  const t = useTranslations("admin.reports")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()

  const [openTarget, setOpenTarget] = useState<AdminReportRow | null>(null)
  const [actionType, setActionType] = useState<ModerationActionType>("hide")
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/reports?${next.toString()}`))
  }

  function quickStatus(report: AdminReportRow, status: ReportStatus) {
    startTransition(async () => {
      const result = await setReportStatus(report.id, status)
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(
        status === "dismissed" ? t("success.dismissed") : t("success.resolved"),
      )
      router.refresh()
    })
  }

  function openActionDialog(report: AdminReportRow) {
    setOpenTarget(report)
    setActionType("hide")
    setReason("")
  }

  function closeActionDialog() {
    setOpenTarget(null)
    setReason("")
  }

  function submitAction() {
    if (!openTarget) return
    if (!reason.trim()) {
      toast.error(t("modActionReason"))
      return
    }

    startTransition(async () => {
      const result = await applyModerationAction({
        reportId: openTarget.id,
        actionType,
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(t("success.actionApplied"))
      closeActionDialog()
      router.refresh()
    })
  }

  return {
    actionType,
    closeActionDialog,
    openActionDialog,
    openTarget,
    pending,
    quickStatus,
    reason,
    setActionType,
    setReason,
    submitAction,
    updateParam,
  }
}
