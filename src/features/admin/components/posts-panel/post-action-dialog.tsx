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
import type { AdminPostRow } from "../../api/posts"
import type { PostModerationAction } from "./constants"

type ConfirmTarget = {
  post: AdminPostRow
  action: PostModerationAction
}

function preview(content: string, max = 100) {
  return `${content.substring(0, max)}${content.length > max ? "..." : ""}`
}

export function PostActionDialog({
  confirmTarget,
  onClose,
  onReasonChange,
  onSubmit,
  pending,
  reason,
}: {
  confirmTarget: ConfirmTarget | null
  onClose: () => void
  onReasonChange: (value: string) => void
  onSubmit: () => void
  pending: boolean
  reason: string
}) {
  const t = useTranslations("admin.posts")
  const tCommon = useTranslations("common")

  return (
    <AlertDialog
      open={!!confirmTarget}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmTarget
              ? `${t(confirmTarget.action)} - ${preview(
                  confirmTarget.post.content,
                )}`
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
