"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

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
import type { ReportTypeOption } from "../api/actions"

const REPORT_GROUPS: {
  labelVi: string
  labelEn: string
  codes: string[]
}[] = [
  {
    labelVi: "Job & Tuyển dụng",
    labelEn: "Jobs & Recruitment",
    codes: ["job_scam", "misleading_job", "discriminatory", "spam_job"],
  },
  {
    labelVi: "Uy tín & Danh tính",
    labelEn: "Trust & Identity",
    codes: ["fake_company", "impersonation", "fake_profile"],
  },
  {
    labelVi: "Nội dung chung & An toàn",
    labelEn: "Content & Safety",
    codes: ["spam", "harassment", "hate_speech", "unprofessional", "misinformation"],
  },
  {
    labelVi: "Pháp lý & Nghiêm trọng",
    labelEn: "Legal & Serious",
    codes: ["fraud", "ip_violation", "privacy_violation", "violence", "self_harm"],
  },
  {
    labelVi: "Khác",
    labelEn: "Other",
    codes: ["other"],
  },
]

type Props = {
  open: boolean
  onClose: () => void
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
}

export function ReportDialog({ open, onClose, targetType, targetId }: Props) {
  const t = useTranslations("reports")
  const locale = useLocale()
  const { data: reportTypes = [], isLoading } = useReportTypes()
  const createReport = useCreateReport()

  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")

  const typeMap = useMemo(
    () => new Map(reportTypes.map((rt) => [rt.code, rt])),
    [reportTypes],
  )

  const grouped = useMemo(() => {
    const assigned = new Set<string>()
    const groups = REPORT_GROUPS.map((g) => ({
      label: locale === "vi" ? g.labelVi : g.labelEn,
      items: g.codes
        .map((c) => typeMap.get(c))
        .filter((rt): rt is ReportTypeOption => !!rt),
    }))
    for (const g of REPORT_GROUPS) {
      for (const c of g.codes) assigned.add(c)
    }
    const ungrouped = reportTypes.filter((rt) => !assigned.has(rt.code))
    if (ungrouped.length > 0) {
      groups.push({
        label: locale === "vi" ? "Khác" : "Other",
        items: ungrouped,
      })
    }
    return groups.filter((g) => g.items.length > 0)
  }, [reportTypes, locale, typeMap])

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
          <DialogTitle className="text-base">
            {t("reportTitle", { type: t(`targetTypes.${targetType}`) })}
          </DialogTitle>
        </DialogHeader>

        <div className="px-2 pb-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("loadingTypes")}
            </div>
          ) : grouped.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t("loadingTypes")}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((rt) => {
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
                      {locale === "vi" ? rt.name : (rt.nameEn ?? rt.name)}
                    </button>
                  )
                })}
              </div>
            ))
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
