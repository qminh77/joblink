"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  CheckCircle2,
  MapPin,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { btnTap } from "@/lib/animations"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { useToggleSavedJob } from "../hooks"
import { formatLocation, formatSalary } from "../lib/format"
import type { JobListItem } from "../types"

type Props = {
  job: JobListItem
  showCompanyLink?: boolean
}

export function JobCard({ job, showCompanyLink = true }: Props) {
  const t = useTranslations("jobs.public")
  const formatRel = useRelativeTimeFormatter()

  const [saved, setSaved] = useState(job.viewerSaved)
  const toggle = useToggleSavedJob({
    onRollback: () => setSaved((v) => !v),
  })

  const salary = formatSalary(job)
  const location = formatLocation(job)

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (toggle.isPending) return
    setSaved((v) => !v)
    toggle.mutate(job.id, {
      onSuccess: (result) => {
        if (result.ok) setSaved(result.saved)
      },
    })
  }

  return (
    <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 rounded-lg shrink-0">
          {job.companyLogoUrl ? (
            <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
          ) : null}
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
            <Briefcase className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/jobs/${job.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
              >
                {job.title}
              </Link>
              {showCompanyLink ? (
                <Link
                  href={`/company/${job.companyUserId}`}
                  className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  {job.companyName}
                  {job.companyVerified ? (
                    <BadgeCheck className="w-3 h-3 text-primary" />
                  ) : null}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  {job.companyName}
                </span>
              )}
            </div>
            <motion.button
              type="button"
              {...btnTap}
              onClick={handleToggleSave}
              disabled={toggle.isPending}
              className={`p-1.5 rounded-full hover:bg-muted transition-colors ${
                saved ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={saved ? t("unsave") : t("save")}
            >
              <Bookmark
                className={`w-4 h-4 ${saved ? "fill-current" : ""}`}
              />
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            {location ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            ) : null}
            {job.jobTypeName ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{job.jobTypeName}</span>
              </>
            ) : null}
            {job.workModeName ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{job.workModeName}</span>
              </>
            ) : null}
            {salary ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {salary}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
            <span>{formatRel(job.createdAt)}</span>
            {job.viewerApplied ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {t("applied")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
