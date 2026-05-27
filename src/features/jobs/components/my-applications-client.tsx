"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fadeUp, pageEntrance, staggerSm } from "@/lib/animations"
import { profileHref } from "@/lib/utils/profile-url"

import { useRespondInterview, useWithdrawApplication } from "../hooks"
import type { ApplicationStatusValue, MyApplicationItem } from "../types"

const STATUS_TONE: Record<ApplicationStatusValue, string> = {
  applied: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
  reviewed: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  interview: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
  offered: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  hired: "text-green-700 bg-green-100 dark:bg-green-500/15",
  rejected: "text-red-600 bg-red-50 dark:bg-red-500/10",
  withdrawn: "text-muted-foreground bg-muted",
}

const WITHDRAWABLE = new Set<ApplicationStatusValue>([
  "applied",
  "reviewed",
  "interview",
  "offered",
])

export function MyApplicationsClient({
  items,
}: {
  items: MyApplicationItem[]
}) {
  const t = useTranslations("jobs.applications")
  const tStatus = useTranslations("companies.dashboard.appStatus")
  const format = useFormatter()
  const router = useRouter()

  const respond = useRespondInterview()
  const withdraw = useWithdrawApplication()

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl border-border/30 p-10 text-center">
        <Clock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <Button asChild variant="outline" className="rounded-lg mt-4">
          <Link href="/jobs">{t("browseJobs")}</Link>
        </Button>
      </Card>
    )
  }

  return (
    <motion.div
      variants={staggerSm}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {items.map((app) => {
        const interview = app.interview
        return (
          <motion.div key={app.applicationId} variants={fadeUp}>
            <Card className="rounded-2xl border-border/30 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="w-11 h-11 rounded-xl shrink-0">
                    {app.companyLogoUrl ? (
                      <AvatarImage src={app.companyLogoUrl} alt={app.companyName} />
                    ) : null}
                    <AvatarFallback className="rounded-xl">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="font-semibold text-foreground hover:text-primary line-clamp-1"
                    >
                      {app.jobTitle}
                    </Link>
                    <Link
                      href={profileHref(app.companyUserId, "company")}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {app.companyName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {t("appliedOn", {
                        date: format.dateTime(new Date(app.appliedAt), {
                          dateStyle: "medium",
                        }),
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${STATUS_TONE[app.status]}`}
                >
                  {tStatus(app.status)}
                </span>
              </div>

              {interview ? (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                    <CalendarClock className="w-4 h-4" />
                    {t("interviewHeading")}
                  </div>
                  <p className="text-sm text-foreground">
                    {format.dateTime(new Date(interview.scheduledAt), {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                    {" · "}
                    {t("durationMinutes", { count: interview.durationMinutes })}
                  </p>
                  {interview.locationOrLink ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 break-all">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {isUrl(interview.locationOrLink) ? (
                        <a
                          href={interview.locationOrLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {interview.locationOrLink}
                        </a>
                      ) : (
                        interview.locationOrLink
                      )}
                    </p>
                  ) : null}
                  {interview.note ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {interview.note}
                    </p>
                  ) : null}

                  {interview.status === "scheduled" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="rounded-lg h-8"
                        disabled={respond.isPending}
                        onClick={() =>
                          respond.mutate(
                            { interviewId: interview.id, accept: true },
                            { onSuccess: () => router.refresh() },
                          )
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {t("confirmInterview")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8"
                        disabled={respond.isPending}
                        onClick={() =>
                          respond.mutate(
                            { interviewId: interview.id, accept: false },
                            { onSuccess: () => router.refresh() },
                          )
                        }
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        {t("declineInterview")}
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        interview.status === "confirmed"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {interview.status === "confirmed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {t(`interviewStatus.${interview.status}`)}
                    </span>
                  )}
                </div>
              ) : null}

              {WITHDRAWABLE.has(app.status) ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg h-8 text-xs text-muted-foreground hover:text-destructive"
                    disabled={withdraw.isPending}
                    onClick={() =>
                      withdraw.mutate(app.applicationId, {
                        onSuccess: () => router.refresh(),
                      })
                    }
                  >
                    {t("withdraw")}
                  </Button>
                </div>
              ) : null}
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

export function MyApplicationsHeader() {
  const t = useTranslations("jobs.applications")
  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show">
      <h1 className="font-headline font-bold text-2xl text-foreground">
        {t("heading")}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">{t("subheading")}</p>
    </motion.div>
  )
}
