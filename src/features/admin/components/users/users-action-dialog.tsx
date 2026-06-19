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
import type { AdminUserRow } from "@/features/admin/types"

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export type UserActionType = "suspend" | "ban" | "restore"

export function UsersActionDialog({
  confirmTarget,
  setConfirmTarget,
  reason,
  setReason,
  submitAction,
  pending,
}: {
  confirmTarget: { user: AdminUserRow; action: UserActionType } | null
  setConfirmTarget: (val: null) => void
  reason: string
  setReason: (val: string) => void
  submitAction: () => void
  pending: boolean
}) {
  const t = useTranslations("admin.users")
  const tCommon = useTranslations("common")

  return (
    <AlertDialog
      open={!!confirmTarget}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmTarget(null)
          setReason("")
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmTarget ? (
              <>
                <strong>{t(`action${cap(confirmTarget.action)}` as never)}</strong>
                {" — "}
                {confirmTarget.user.displayName} ({confirmTarget.user.email})
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t("confirmReason")}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || !reason.trim()}
            onClick={(e) => {
              e.preventDefault()
              submitAction()
            }}
          >
            {pending ? t("submitting") : t("submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
