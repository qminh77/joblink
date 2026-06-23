"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { fadeUp, pageEntrance, staggerSm } from "@/lib/animations"
import { profileHref } from "@/lib/utils/profile-url"

import { useWithdrawApplication } from "../hooks"
import type { ApplicationStatusValue, MyApplicationItem } from "../types"

const STATUS_TONE: Record<ApplicationStatusValue, string> = {
  submitted: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
  withdrawn: "text-muted-foreground bg-muted",
  closed: "text-red-600 bg-red-50 dark:bg-red-500/10",
}

const WITHDRAWABLE = new Set<ApplicationStatusValue>([
  "submitted",
])

export function MyApplicationsClient({
  items,
}: {
  items: MyApplicationItem[]
}) {
  const t = useTranslations("jobs.applications")
  const tStatus = useTranslations("notifications.appStatus")
  const format = useFormatter()
  const router = useRouter()

  const withdraw = useWithdrawApplication()

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl bg-card border-border/40 p-10 text-center">
        <Clock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <Link
          href="/jobs"
          className="inline-flex items-center text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors mt-4"
        >
          {t("browseJobs")}
        </Link>
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
      {items.map((app) => (
          <motion.div key={app.applicationId} variants={fadeUp}>
            <Card className="rounded-2xl bg-card border-border/40 p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="w-11 h-11 rounded-lg shrink-0">
                    {app.companyLogoUrl ? (
                      <AvatarImage src={app.companyLogoUrl} alt={app.companyName} />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                      <Building2 className="w-5 h-5" />
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

              {WITHDRAWABLE.has(app.status) ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={withdraw.isPending}
                    onClick={() =>
                      withdraw.mutate(app.applicationId, {
                        onSuccess: () => router.refresh(),
                      })
                    }
                    className="text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t("withdraw")}
                  </button>
                </div>
              ) : null}
            </Card>
          </motion.div>
      ))}
    </motion.div>
  )
}

export function MyApplicationsHeader() {
  const t = useTranslations("jobs.applications")
  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="pb-2 border-b border-border/40"
    >
      <h1 className="font-headline font-bold text-xl text-foreground">
        {t("heading")}
      </h1>
      <p className="text-xs text-muted-foreground mt-0.5">{t("subheading")}</p>
    </motion.div>
  )
}
