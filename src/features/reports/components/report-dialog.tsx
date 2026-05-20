"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useReportTypes, useCreateReport } from "../hooks"

type Props = {
  open: boolean
  onClose: () => void
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
}

export function ReportDialog({ open, onClose, targetType, targetId }: Props) {
  const t = useTranslations("reports")
  const { data: reportTypes = [], isLoading } = useReportTypes()
  const createReport = useCreateReport()

  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  async function handleSubmit() {
    if (!reason) return
    await createReport.mutateAsync({
      targetType,
      targetId,
      reason,
      description: description.trim() || null,
    })
    setReason("")
    setDescription("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-sm gap-0 p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">{t("reportTitle")}</DialogTitle>
        </DialogHeader>

        <div className="px-2 pb-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("loadingTypes")}
            </div>
          ) : reportTypes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Không có loại báo cáo
            </div>
          ) : (
            reportTypes.map((rt) => {
              const active = reason === rt.code
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setReason(rt.code)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {rt.name}
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-border/40 px-4 py-3">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={2}
            maxLength={500}
            className="min-h-0 resize-none text-sm"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/40 px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason || createReport.isPending}
          >
            {createReport.isPending ? t("submitting") : t("submitReport")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
