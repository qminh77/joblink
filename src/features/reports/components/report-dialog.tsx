"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { useReportReasons, useCreateReport } from "../hooks"

type Props = {
  open: boolean
  onClose: () => void
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
}

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function ReportDialog({ open, onClose, targetType, targetId }: Props) {
  const t = useTranslations("reports")
  const locale = useLocale()
  const { data: reportReasons = [], isLoading, isError } = useReportReasons()
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
      <DialogContent aria-describedby={undefined} className="sm:max-w-sm gap-0 p-0 rounded-2xl bg-background/95 backdrop-blur-2xl overflow-hidden border-border/40 shadow-2xl">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base font-medium">{t("reportTitle")}</DialogTitle>
        </DialogHeader>

        <div className="px-1 pb-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("loadingReasons")}
            </div>
          ) : isError ? (
            <div className="py-6 text-center text-sm text-destructive">
              {t("errors.unexpected")}
            </div>
          ) : reportReasons.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("emptyReasons")}
            </div>
          ) : (
            reportReasons.map((option, index) => {
              const active = reason === option.code
              return (
                <motion.div
                  key={option.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: index * 0.05 }}
                  className="px-1"
                >
                  <button
                    type="button"
                    onClick={() => setReason(option.code)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all cursor-pointer outline-none",
                      active
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {locale === "en" && option.nameEn
                      ? option.nameEn
                      : option.name}
                  </button>
                </motion.div>
              )
            })
          )}
        </div>

        <div className="border-t border-border/20 px-4 py-3 bg-muted/10">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={2}
            maxLength={500}
            className="min-h-0 resize-none text-sm rounded-xl bg-background/50 border-border/40 focus-visible:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/20 px-4 py-3 bg-muted/10">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl hover:bg-muted/50">
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!reason || createReport.isPending}
            className="rounded-xl"
          >
            {createReport.isPending ? t("submitting") : t("submitReport")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
