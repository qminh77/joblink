"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { AnimatePresence, motion } from "framer-motion"
import { ExternalLink, FileText, UserSquare, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils/format"
import { modalContent, modalOverlay } from "@/lib/animations"

import type { DashboardApplicantItem } from "../../types"

type Props = {
  applicant: DashboardApplicantItem | null
  onClose: () => void
}

export function ApplicantDetailDialog({ applicant, onClose }: Props) {
  const t = useTranslations("companies.applicantDetail")

  return (
    <AnimatePresence>
      {applicant ? (
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
            className="w-full max-w-lg bg-card border border-border/40 rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40 sticky top-0 bg-card">
              <h2 className="font-headline font-bold text-lg">{t("title")}</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                aria-label={t("close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {applicant.avatarUrl ? (
                    <AvatarImage src={applicant.avatarUrl} alt={applicant.displayName} />
                  ) : null}
                  <AvatarFallback>{getInitials(applicant.displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <Link
                    href={`/profile/${applicant.applicantId}`}
                    className="font-semibold text-foreground hover:text-primary truncate block"
                  >
                    {applicant.displayName}
                  </Link>
                  {applicant.headline ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {applicant.headline}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border/40 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("appliedForLabel")}
                </p>
                <Link
                  href={`/jobs/${applicant.jobId}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {applicant.jobTitle}
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> {t("resumeLabel")}
                </p>
                {applicant.resumeUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                  >
                    <a
                      href={applicant.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      {t("openResume")}
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t("noResume")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserSquare className="w-3.5 h-3.5" /> {t("coverLetterLabel")}
                </p>
                {applicant.coverLetter ? (
                  <p className="text-sm text-foreground/90 whitespace-pre-line rounded-xl bg-muted/40 p-3">
                    {applicant.coverLetter}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t("noCoverLetter")}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
