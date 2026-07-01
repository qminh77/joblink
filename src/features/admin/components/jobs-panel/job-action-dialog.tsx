"use client"

import { useTranslations } from "next-intl"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import type { JobActionTarget } from "./types"

export function JobActionDialog({
  target,
  reason,
  pending,
  onReasonChange,
  onOpenChange,
  onSubmit,
}: {
  target: JobActionTarget | null
  reason: string
  pending: boolean
  onReasonChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}) {
  const t = useTranslations("admin.jobs")
  const tCommon = useTranslations("common")

  return (
    <AlertDialog open={!!target} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? `${target.action === "remove" ? t("remove") : t("restore")} — ${target.job.title}`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder={t("reason")}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={3}
          maxLength={500}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !reason.trim()}
            onClick={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            {pending ? t("submitting") : t("submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
