"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AdminReportRow } from "@/features/admin/types"
import type { ModerationActionType } from "@/types/database"
import { ACTION_TYPES } from "./constants"

export function ModerationDialog({
  actionType,
  onActionTypeChange,
  onClose,
  onReasonChange,
  onSubmit,
  openTarget,
  pending,
  reason,
}: {
  actionType: ModerationActionType
  onActionTypeChange: (value: ModerationActionType) => void
  onClose: () => void
  onReasonChange: (value: string) => void
  onSubmit: () => void
  openTarget: AdminReportRow | null
  pending: boolean
  reason: string
}) {
  const t = useTranslations("admin.reports")
  const tCommon = useTranslations("common")
  const tTypes = useTranslations("admin.reports.types")

  return (
    <Dialog
      open={!!openTarget}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modActionTitle")}</DialogTitle>
          <DialogDescription>
            {openTarget
              ? `${tTypes(openTarget.targetType)} #${openTarget.targetId} - ${openTarget.reasonName}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {openTarget?.description ? (
          <Card className="bg-transparent border-none shadow-none rounded-lg p-3 text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
            &ldquo;{openTarget.description}&rdquo;
          </Card>
        ) : null}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">
              {t("modActionType")}
            </label>
            <Select
              value={actionType}
              onValueChange={(value) =>
                onActionTypeChange(value as ModerationActionType)
              }
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              {t("modActionReason")}
            </label>
            <Textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={pending || !reason.trim()}>
            {pending ? t("submitting") : t("actionTake")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
