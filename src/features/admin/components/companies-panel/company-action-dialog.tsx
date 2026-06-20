"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { AdminCompanyRow } from "../../types"
import type { CompanyAction } from "./constants"

type ConfirmTarget = {
  company: AdminCompanyRow
  action: CompanyAction
}

export function CompanyActionDialog({
  confirmTarget,
  note,
  onClose,
  onNoteChange,
  onSubmit,
  pending,
}: {
  confirmTarget: ConfirmTarget | null
  note: string
  onClose: () => void
  onNoteChange: (value: string) => void
  onSubmit: () => void
  pending: boolean
}) {
  const t = useTranslations("admin.companies")
  const tCommon = useTranslations("common")

  return (
    <Dialog
      open={!!confirmTarget}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {confirmTarget ? t(confirmTarget.action) : t("approve")}
          </DialogTitle>
          <DialogDescription>
            {confirmTarget ? confirmTarget.company.name : ""}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={t("note")}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={3}
          maxLength={500}
        />
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending
              ? t("submitting")
              : confirmTarget
                ? t(confirmTarget.action)
                : t("approve")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
