"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  MapPin,
  Pencil,
  Send,
  Share2,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { formatLocation, formatSalary } from "../../lib/format"
import type { JobDetail } from "../../types"

type JobSummaryCardProps = {
  detail: JobDetail
  saved: boolean
  canApply: boolean
  savePending: boolean
  withdrawPending: boolean
  onApply: () => void
  onReport: () => void
  onSend: () => void
  onShare: () => void
  onToggleSave: () => void
  onWithdraw: (applicationId: number) => void
}

export function JobSummaryCard({
  detail,
  saved,
  canApply,
  savePending,
  withdrawPending,
  onApply,
  onReport,
  onSend,
  onShare,
  onToggleSave,
  onWithdraw,
}: JobSummaryCardProps) {
  const locale = useLocale()
  const t = useTranslations("jobs.public")
  const tAppStatus = useTranslations("notifications.appStatus")
  const formatRel = useRelativeTimeFormatter()

  const { job, viewer } = detail
  const salary = formatSalary(job)
  const location = formatLocation(job)

  return (
    <Card className="bg-card rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 rounded-xl">
          {job.companyLogoUrl ? (
            <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
          ) : null}
          <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
            <Briefcase className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="min-w-0">
            <h1 className="font-headline font-bold text-2xl text-foreground break-words">
              {job.title}
            </h1>
            <Link
              href={`/company/${job.companyUserId}`}
              className="text-primary hover:opacity-80 font-medium text-sm inline-flex items-center gap-1"
            >
              {job.companyName}
              {job.companyVerified ? <BadgeCheck className="w-4 h-4" /> : null}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {location}
                </span>
              ) : null}
              {salary ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" /> {salary}
                  </span>
                </>
              ) : null}
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {formatRel(job.createdAt)}
              </span>
              {job.expiresAt ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span
                    className={`flex items-center gap-1.5 ${
                      new Date(job.expiresAt) < new Date()
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    <CalendarClock className="w-4 h-4" />
                    {t("deadlineLabel", {
                      date: formatDate(job.expiresAt, locale),
                    })}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-border/30 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            {viewer.isOwner ? (
              <Button asChild className="w-full sm:w-auto" size="lg">
                <Link href="/company/post-job">
                  <Pencil />
                  {t("manageJob")}
                </Link>
              </Button>
            ) : viewer.viewerApplied ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Badge
                  variant="outline"
                  className="h-9 justify-center border-0 bg-emerald-50 px-3 text-emerald-600 dark:bg-emerald-500/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {viewer.applicationStatus
                    ? tAppStatus(viewer.applicationStatus)
                    : t("applied")}
                </Badge>
                {viewer.applicationId &&
                !["hired", "rejected", "withdrawn"].includes(
                  viewer.applicationStatus ?? "",
                ) ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={withdrawPending}
                    onClick={() => onWithdraw(viewer.applicationId as number)}
                  >
                    {withdrawPending ? t("withdrawing") : t("withdraw")}
                  </Button>
                ) : null}
              </div>
            ) : canApply ? (
              <Button
                type="button"
                onClick={onApply}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Send />
                {t("apply")}
              </Button>
            ) : (
              <Badge
                variant="outline"
                className="h-9 justify-center border-0 bg-muted px-3 text-muted-foreground"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {t("notAcceptingApplications")}
              </Badge>
            )}
          </div>

          {!viewer.isOwner ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[360px]">
              <Button
                type="button"
                variant={saved ? "secondary" : "outline"}
                size="sm"
                onClick={onToggleSave}
                disabled={savePending}
                aria-label={saved ? t("unsave") : t("save")}
              >
                <Bookmark className={saved ? "fill-current" : ""} />
                <span className="truncate">
                  {saved ? t("saved") : t("save")}
                </span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onShare}>
                <Share2 />
                <span className="truncate">{t("share")}</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onSend}>
                <Send />
                <span className="truncate">{t("send")}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReport}
                className="text-muted-foreground hover:text-destructive"
              >
                <Flag />
                <span className="truncate">{t("report")}</span>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {job.jobTypeName ? (
          <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {job.jobTypeName}
          </span>
        ) : null}
        {job.workModeName ? (
          <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {job.workModeName}
          </span>
        ) : null}
        {job.positionTitle ?? job.jobPositionName ? (
          <span className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {job.positionTitle ?? job.jobPositionName}
          </span>
        ) : null}
      </div>
    </Card>
  )
}
