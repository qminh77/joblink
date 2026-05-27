"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline font-bold text-sm">
            {t("overviewJobsHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("emptyJobs")}
            </p>
          ) : (
            <motion.div
              variants={staggerSm}
              initial="hidden"
              animate="show"
              className="divide-y divide-border/30"
            >
              {recentJobs.slice(0, 5).map((job) => (
                <motion.div
                  key={job.id}
                  variants={slideLeft}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block leading-tight"
                      >
                        {job.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("jobMeta", {
                          applicants: job.applicantCount,
                          views: job.viewCount,
                          time: formatRel(job.createdAt),
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-semibold border-0 ${JOB_STATUS_TONE[job.status]}`}
                  >
                    {t(`jobStatus.${job.status}`)}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline font-bold text-sm">
            {t("overviewApplicantsHeading")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentApplicants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t("emptyApplicants")}
            </p>
          ) : (
            <motion.div
              variants={staggerSm}
              initial="hidden"
              animate="show"
              className="divide-y divide-border/30"
            >
              {recentApplicants.slice(0, 5).map((app) => (
                <motion.div
                  key={app.applicationId}
                  variants={fadeUp}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      {app.avatarUrl ? (
                        <AvatarImage src={app.avatarUrl} alt={app.displayName} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(app.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${app.applicantId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block leading-tight"
                      >
                        {app.displayName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {app.jobTitle}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("appliedAt", { time: formatRel(app.appliedAt) })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-semibold border-0 ${APP_STATUS_TONE[app.status]}`}
                  >
                    {t(`appStatus.${app.status}`)}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
