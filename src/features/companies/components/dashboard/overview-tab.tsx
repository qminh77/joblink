"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { fadeUp, slideLeft, staggerSm } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import type {
  DashboardRecentApplicant,
  DashboardRecentJob,
} from "../../types"

import { APP_STATUS_TONE, JOB_STATUS_TONE } from "./shared"

type Props = {
  recentJobs: DashboardRecentJob[]
  recentApplicants: DashboardRecentApplicant[]
}

export function OverviewTab({ recentJobs, recentApplicants }: Props) {
  const t = useTranslations("companies.dashboard")
  const formatRel = useRelativeTimeFormatter()

  return (
    <>
      <Card className="bg-card border-border/30 rounded-xl p-6">
        <h2 className="font-headline font-bold text-lg text-foreground mb-4">
          {t("overviewJobsHeading")}
        </h2>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("emptyJobs")}
          </p>
        ) : (
          <motion.div
            variants={staggerSm}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {recentJobs.slice(0, 5).map((job) => (
              <motion.div
                key={job.id}
                variants={slideLeft}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t("jobMeta", {
                        applicants: job.applicantCount,
                        time: formatRel(job.createdAt),
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${JOB_STATUS_TONE[job.status]}`}
                >
                  {t(`jobStatus.${job.status}`)}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      <Card className="bg-card border-border/30 rounded-xl p-6">
        <h2 className="font-headline font-bold text-lg text-foreground mb-4">
          {t("overviewApplicantsHeading")}
        </h2>
        {recentApplicants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("emptyApplicants")}
          </p>
        ) : (
          <motion.div
            variants={staggerSm}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {recentApplicants.slice(0, 5).map((app) => (
              <motion.div
                key={app.applicationId}
                variants={fadeUp}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9">
                    {app.avatarUrl ? (
                      <AvatarImage src={app.avatarUrl} alt={app.displayName} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(app.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${app.applicantId}`}
                      className="font-semibold text-sm text-foreground hover:text-primary truncate block"
                    >
                      {app.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.headline ? `${app.headline} • ` : ""}
                      {app.jobTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("appliedAt", { time: formatRel(app.appliedAt) })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${APP_STATUS_TONE[app.status]}`}
                >
                  {t(`appStatus.${app.status}`)}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </>
  )
}
