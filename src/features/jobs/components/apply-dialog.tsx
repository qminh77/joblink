"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Send, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CvPicker } from "@/features/cvs/components/cv-picker"
import { loadOwnCvsAction } from "@/features/cvs/api/read-actions"
import type { OwnCvSummary } from "@/features/cvs/types"
import { modalContent, modalOverlay } from "@/lib/animations"

import { useApplyToJob } from "../hooks"
import type { ApplyResult } from "../types"

type Props = {
  jobId: number
  jobTitle: string
  companyName: string
  open: boolean
  onClose: () => void
  onApplied?: (result: Extract<ApplyResult, { ok: true }>) => void
}

// Form sống trong ApplyDialogContent — mount theo `open=true` (AnimatePresence
// unmount khi close) nên state reset mỗi lần mở; tránh setState-in-effect.
function ApplyDialogContent({
  jobId,
  jobTitle,
  companyName,
  onClose,
  onApplied,
}: {
  jobId: number
  jobTitle: string
  companyName: string
  onClose: () => void
  onApplied?: (result: Extract<ApplyResult, { ok: true }>) => void
}) {
  const t = useTranslations("jobs.public")
  const [coverLetter, setCoverLetter] = useState("")
  const [cvs, setCvs] = useState<OwnCvSummary[] | null>(null)
  const [selectedCv, setSelectedCv] = useState<number | null>(null)
  const apply = useApplyToJob()

  // Lazy-load CVs ngay khi mount. Component này chỉ mount khi dialog mở nên
  // effect chỉ chạy 1 lần / mỗi lần mở — không "set state đầu effect" liên tục.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await loadOwnCvsAction()
      if (cancelled) return
      setCvs(res.ok ? res.data : [])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshCvs() {
    const res = await loadOwnCvsAction()
    const next = res.ok ? res.data : []
    setCvs(next)
    return next
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apply.isPending || !selectedCv) return
    apply.mutate(
      {
        jobId,
        coverLetter: coverLetter.trim() || null,
        resumeCvId: selectedCv,
      },
      {
        onSuccess: (result) => {
          if (result.ok) {
            onApplied?.(result)
            onClose()
          }
        },
      },
    )
  }

  return (
    <motion.div
      variants={modalContent}
      initial="hidden"
      animate="show"
      exit="exit"
      className="w-full max-w-lg bg-card border border-border/40 rounded-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="min-w-0">
          <h2 className="font-headline font-bold text-base truncate">
            {t("applyDialogTitle")}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {jobTitle} • {companyName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          aria-label={t("close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {cvs === null ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CvPicker
            cvs={cvs}
            value={selectedCv}
            onChange={setSelectedCv}
            refreshOnUpload={refreshCvs}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="cover-letter" className="font-medium text-sm">
            {t("coverLetterLabel")}
          </Label>
          <Textarea
            id="cover-letter"
            rows={6}
            placeholder={t("coverLetterPlaceholder")}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            disabled={apply.isPending}
            maxLength={5000}
            className="rounded-xl resize-none"
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {coverLetter.length}/5000
          </p>
        </div>

        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={onClose}
            disabled={apply.isPending}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={apply.isPending || !selectedCv}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {apply.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t("submitApplication")}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export function ApplyDialog({
  jobId,
  jobTitle,
  companyName,
  open,
  onApplied,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <ApplyDialogContent
            jobId={jobId}
            jobTitle={jobTitle}
            companyName={companyName}
            onApplied={onApplied}
            onClose={onClose}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
