"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useMyAppeals, useSubmitAppeal } from "@/features/reports/hooks"
import { formatDate } from "@/lib/utils/format"
import type { AppealStatus, ModerationActionType } from "@/types/database"

const ACTION_TONE: Partial<Record<ModerationActionType, string>> = {
  warn: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  suspend: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  ban: "bg-destructive/15 text-destructive border-destructive/30",
}

const STATUS_TONE: Record<AppealStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-muted text-muted-foreground",
}

// UC-71: người bị xử lý xem hành động kiểm duyệt cấp tài khoản nhắm vào mình và
// gửi khiếu nại (mỗi hành động một đơn). Trạng thái đơn hiển thị trực tiếp.
export function AppealsCard() {
  const t = useTranslations("settings.appeals")
  const tAction = useTranslations("settings.appeals.actions")
  const tStatus = useTranslations("settings.appeals.statuses")
  const { data, isLoading } = useMyAppeals()
  const submit = useSubmitAppeal()
  const list = data ?? []

  const [activeId, setActiveId] = useState<number | null>(null)
  const [reason, setReason] = useState("")

  async function handleSubmit() {
    if (activeId == null || !reason.trim()) return
    await submit.mutateAsync({
      moderationActionId: activeId,
      reason: reason.trim(),
    })
    setActiveId(null)
    setReason("")
  }

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-4">
      <div>
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t("loading")}
        </p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center">
          <ShieldCheck className="w-9 h-9 text-emerald-500/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((action) => (
            <li
              key={action.id}
              className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/40"
            >
              <div className="min-w-0 space-y-1.5">
                <Badge
                  variant="outline"
                  className={`border-0 ${ACTION_TONE[action.actionType] ?? "bg-muted text-muted-foreground"}`}
                >
                  {tAction(action.actionType)}
                </Badge>
                <p className="text-sm text-foreground/90 whitespace-pre-line break-words">
                  {action.reason}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(action.createdAt)}
                </p>
              </div>
              <div className="shrink-0">
                {action.appeal ? (
                  <Badge
                    variant="outline"
                    className={`border-0 ${STATUS_TONE[action.appeal.status]}`}
                  >
                    {tStatus(action.appeal.status)}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setActiveId(action.id)
                      setReason("")
                    }}
                  >
                    {t("appealAction")}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={activeId != null}
        onOpenChange={(v) => {
          if (!v) setActiveId(null)
        }}
      >
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{t("dialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{t("dialogHint")}</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reasonPlaceholder")}
            rows={4}
            maxLength={500}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveId(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!reason.trim() || submit.isPending}
            >
              {submit.isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
