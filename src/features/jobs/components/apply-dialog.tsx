"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Send, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { modalContent, modalOverlay } from "@/lib/animations"

import { useApplyToJob } from "../hooks"

type Props = {
  jobId: number
  jobTitle: string
  companyName: string
  open: boolean
  onClose: () => void
}

export function ApplyDialog({ jobId, jobTitle, companyName, open, onClose }: Props) {
  const t = useTranslations("jobs.public")
  const [coverLetter, setCoverLetter] = useState("")
  const [resumeUrl, setResumeUrl] = useState("")
  const apply = useApplyToJob()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apply.isPending) return
    apply.mutate(
      {
        jobId,
        coverLetter: coverLetter.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
      },
      {
        onSuccess: (result) => {
          if (result.ok) onClose()
        },
      },
    )
  }

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
              <div className="space-y-2">
                <Label htmlFor="resume-url" className="font-medium text-sm">
                  {t("resumeUrlLabel")}
                </Label>
                <Input
                  id="resume-url"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  disabled={apply.isPending}
                  className="h-11 rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("resumeUrlHint")}
                </p>
              </div>

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
                  disabled={apply.isPending}
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
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
