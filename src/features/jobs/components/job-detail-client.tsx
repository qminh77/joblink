"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useLocale, useTranslations } from "next-intl"
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Flag,
  MapPin,
  Pencil,
  Send,
  Share2,
  Users,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fadeUp, pageEntrance } from "@/lib/animations"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import {
  useToggleSavedJob,
  useWithdrawApplication,
} from "../hooks"
import { formatLocation, formatSalary } from "../lib/format"
import { formatDate } from "@/lib/utils/format"
import type { JobDetail } from "../types"

import { ReportDialog } from "@/features/reports/components/report-dialog"

import { ApplyDialog } from "./apply-dialog"
import { JobShareModal } from "./job-share-modal"
import { JobSendModal } from "./job-send-modal"

type Props = {
  detail: JobDetail
}

export function JobDetailClient({ detail }: Props) {
  const locale = useLocale()
  const t = useTranslations("jobs.public")
  const tAppStatus = useTranslations("notifications.appStatus")
  const formatRel = useRelativeTimeFormatter()

  const [saved, setSaved] = useState(detail.viewer.viewerSaved)
  const [showApply, setShowApply] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showSend, setShowSend] = useState(false)

  const toggle = useToggleSavedJob({
    onRollback: () => setSaved((v) => !v),
  })
  const withdraw = useWithdrawApplication()

  const { job, skills, viewer } = detail
  const salary = formatSalary(job)
  const location = formatLocation(job)

  const handleToggleSave = () => {
    if (toggle.isPending) return
    setSaved((v) => !v)
    toggle.mutate(job.id, {
      onSuccess: (result) => {
        if (result.ok) setSaved(result.saved)
      },
    })
  }

  const canApply =
    !viewer.isOwner &&
    !viewer.viewerApplied &&
    job.status === "active" &&
    (job.expiresAt == null || new Date(job.expiresAt) > new Date())

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <motion.div variants={fadeUp}>
          <Card className="bg-card rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 rounded-xl">
                {job.companyLogoUrl ? (
                  <AvatarImage
                    src={job.companyLogoUrl}
                    alt={job.companyName}
                  />
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
                    {job.companyVerified ? (
                      <BadgeCheck className="w-4 h-4" />
                    ) : null}
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
                          disabled={withdraw.isPending}
                          onClick={() =>
                            withdraw.mutate(viewer.applicationId as number)
                          }
                        >
                          {withdraw.isPending ? t("withdrawing") : t("withdraw")}
                        </Button>
                      ) : null}
                    </div>
                  ) : canApply ? (
                    <Button
                      type="button"
                      onClick={() => setShowApply(true)}
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
                      onClick={handleToggleSave}
                      disabled={toggle.isPending}
                      aria-label={saved ? t("unsave") : t("save")}
                    >
                      <Bookmark className={saved ? "fill-current" : ""} />
                      <span className="truncate">
                        {saved ? t("saved") : t("save")}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShare(true)}
                    >
                      <Share2 />
                      <span className="truncate">{t("share")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSend(true)}
                    >
                      <Send />
                      <span className="truncate">{t("send")}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReport(true)}
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
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card rounded-2xl p-6 lg:p-8 space-y-8">
            <div>
              <h2 className="font-headline text-lg font-bold text-foreground mb-3">
                {t("description")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {job.requirements ? (
              <div>
                <h2 className="font-headline text-lg font-bold text-foreground mb-3">
                  {t("requirements")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {job.requirements}
                </p>
              </div>
            ) : null}

            {skills.length > 0 ? (
              <div>
                <h2 className="font-headline text-lg font-bold text-foreground mb-3">
                  {t("requiredSkills")}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="lg:col-span-1">
        <Card className="bg-card rounded-2xl p-6 text-center sticky top-24">
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 overflow-hidden">
            {job.companyLogoUrl ? (
              <Avatar className="w-16 h-16 rounded-xl">
                <AvatarImage
                  src={job.companyLogoUrl}
                  alt={job.companyName}
                />
                <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
                  <Building2 className="w-7 h-7" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <Link
            href={`/company/${job.companyUserId}`}
            className="font-headline text-lg font-bold text-foreground hover:text-primary transition-colors"
          >
            {job.companyName}
          </Link>
          <div className="mt-5 text-left space-y-3 pt-4 border-t border-border/20">
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Ngành nghề</p>
              <p className="text-xs text-muted-foreground">
                {job.companyIndustry || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Quy mô</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {job.companySize || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Về công ty</p>
              <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                {job.companyAbout || "Chưa có thông tin giới thiệu."}
              </p>
            </div>
          </div>
          <Link
            href={`/company/${job.companyUserId}`}
            className="inline-flex items-center justify-center w-full mt-4 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
          >
            {t("viewCompanyPage")}
          </Link>
        </Card>
      </motion.div>

      <ApplyDialog
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showApply}
        onClose={() => setShowApply(false)}
      />

      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="job"
        targetId={job.id}
      />

      <JobShareModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showShare}
        onClose={() => setShowShare(false)}
      />

      <JobSendModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showSend}
        onClose={() => setShowSend(false)}
      />
    </motion.div>
  )
}
