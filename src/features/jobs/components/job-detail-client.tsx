"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Pencil,
  Users,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { fadeUp, pageEntrance } from "@/lib/animations"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import {
  useToggleSavedJob,
  useWithdrawApplication,
} from "../hooks"
import { formatLocation, formatSalary } from "../lib/format"
import type { JobDetail } from "../types"

import { ApplyDialog } from "./apply-dialog"

type Props = {
  detail: JobDetail
}

export function JobDetailClient({ detail }: Props) {
  const t = useTranslations("jobs.public")
  const tAppStatus = useTranslations("companies.dashboard.appStatus")
  const formatRel = useRelativeTimeFormatter()

  const [saved, setSaved] = useState(detail.viewer.viewerSaved)
  const [showApply, setShowApply] = useState(false)

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
          <Card className="bg-card rounded-2xl p-6 border border-border/40">
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
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-headline font-bold text-2xl text-foreground">
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
                              date: new Date(job.expiresAt).toLocaleDateString(),
                            })}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    {viewer.isOwner ? (
                      <Link
                        href="/company/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        {t("manageOnDashboard")}
                      </Link>
                    ) : viewer.viewerApplied ? (
                      <div className="flex flex-col gap-1 items-end">
                        <Badge
                          variant="outline"
                          className="border-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {viewer.applicationStatus
                            ? tAppStatus(viewer.applicationStatus)
                            : t("applied")}
                        </Badge>
                        {viewer.applicationId &&
                        !["hired", "rejected", "withdrawn"].includes(
                          viewer.applicationStatus ?? "",
                        ) ? (
                          <button
                            type="button"
                            disabled={withdraw.isPending}
                            onClick={() =>
                              withdraw.mutate(viewer.applicationId as number)
                            }
                            className="text-[11px] text-destructive hover:underline disabled:opacity-50"
                          >
                            {withdraw.isPending
                              ? t("withdrawing")
                              : t("withdraw")}
                          </button>
                        ) : null}
                      </div>
                    ) : canApply ? (
                      <button
                        type="button"
                        onClick={() => setShowApply(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                      >
                        {t("apply")}
                      </button>
                    ) : (
                      <Badge variant="outline" className="border-0 bg-muted text-muted-foreground gap-1">
                        <XCircle className="w-3 h-3" />
                        {t("notAcceptingApplications")}
                      </Badge>
                    )}
                    {!viewer.isOwner ? (
                      <button
                        type="button"
                        onClick={handleToggleSave}
                        disabled={toggle.isPending}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 h-8 rounded-lg transition-colors ${
                          saved
                            ? "text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <Bookmark
                          className={`w-4 h-4 ${saved ? "fill-current" : ""}`}
                        />
                        {saved ? t("saved") : t("save")}
                      </button>
                    ) : null}
                  </div>
                </div>
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
          <Card className="bg-card rounded-2xl p-6 border border-border/40">
            <h2 className="font-headline text-lg font-bold text-foreground mb-3">
              {t("description")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </Card>
        </motion.div>

        {job.requirements ? (
          <motion.div variants={fadeUp}>
            <Card className="bg-card rounded-2xl p-6 border border-border/40">
              <h2 className="font-headline text-lg font-bold text-foreground mb-3">
                {t("requirements")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </p>
            </Card>
          </motion.div>
        ) : null}

        {skills.length > 0 ? (
          <motion.div variants={fadeUp}>
            <Card className="bg-card rounded-2xl p-6 border border-border/40">
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
            </Card>
          </motion.div>
        ) : null}
      </div>

      <motion.div variants={fadeUp} className="lg:col-span-1">
        <Card className="bg-card rounded-2xl p-6 border border-border/40 text-center sticky top-24">
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
          {job.companyIndustry ? (
            <p className="text-xs text-muted-foreground mt-1">
              {job.companyIndustry}
            </p>
          ) : null}
          {job.companySize ? (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" /> {job.companySize}
            </p>
          ) : null}
          {job.companyAbout ? (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-4 text-left">
              {job.companyAbout}
            </p>
          ) : null}
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
    </motion.div>
  )
}
