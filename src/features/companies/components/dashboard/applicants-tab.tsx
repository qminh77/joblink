"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { CalendarClock, FileText, Loader2, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { slideLeft, staggerSm } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import {
  useCompanyApplicants,
  useUpdateApplicationStatus,
} from "../../hooks"
import type {
  DashboardApplicantItem,
  DashboardApplicantsPage,
  DashboardAppStatus,
} from "../../types"

import { ApplicantDetailDialog } from "./applicant-detail-dialog"
import { InterviewScheduleDialog } from "./interview-schedule-dialog"
import { APP_STATUS_TONE, APP_STATUS_TRANSITIONS } from "./shared"

const TERMINAL_STATUSES = new Set<DashboardAppStatus>([
  "hired",
  "rejected",
  "withdrawn",
])

type Props = {
  initialData: DashboardApplicantsPage
}

const STATUS_OPTIONS: Array<DashboardAppStatus | "all"> = [
  "all",
  "applied",
  "reviewed",
  "interview",
  "offered",
  "hired",
  "rejected",
]

export function ApplicantsTab({ initialData }: Props) {
  const t = useTranslations("companies.dashboard")
  const formatRel = useRelativeTimeFormatter()

  const [status, setStatus] = useState<string>("all")
  const [search, setSearch] = useState("")

  const { data, isFetching } = useCompanyApplicants({
    status,
    search,
    initialData,
  })
  const update = useUpdateApplicationStatus()
  const items = data?.items ?? []

  const [detailApp, setDetailApp] = useState<DashboardApplicantItem | null>(null)
  const [interviewApp, setInterviewApp] =
    useState<DashboardApplicantItem | null>(null)

  return (
    <>
      <Card className="border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
        <div className="flex flex-wrap items-center gap-2 p-4 pb-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 rounded-full bg-muted border-none text-sm"
              placeholder={t("searchApplicantsPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                type="button"
                variant={status === s ? "default" : "outline"}
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setStatus(s)}
              >
                {s === "all"
                  ? t("appsFilter.all")
                  : t(`appStatus.${s}`)}
              </Button>
            ))}
          </div>
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t("emptyApplicants")}
            </div>
          ) : (
            <motion.div
              variants={staggerSm}
              initial="hidden"
              animate="show"
              className="divide-y divide-border/30"
            >
              {items.map((app) => (
                <motion.div
                  key={app.applicationId}
                  variants={slideLeft}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="w-9 h-9 shrink-0">
                      {app.avatarUrl ? (
                        <AvatarImage src={app.avatarUrl} alt={app.displayName} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {getInitials(app.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${app.applicantId}`}
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block leading-tight"
                      >
                        {app.displayName}
                      </Link>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {app.headline ? `${app.headline} • ` : ""}
                        <Link
                          href={`/jobs/${app.jobId}`}
                          className="hover:text-primary"
                        >
                          {app.jobTitle}
                        </Link>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("appliedAt", { time: formatRel(app.appliedAt) })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end sm:shrink-0 pl-12 sm:pl-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold border-0 ${APP_STATUS_TONE[app.status]}`}
                    >
                      {t(`appStatus.${app.status}`)}
                    </Badge>
                    <Select
                      value={app.status}
                      onValueChange={(value) => {
                        if (value === app.status) return
                        update.mutate({
                          applicationId: app.applicationId,
                          newStatus: value,
                        })
                      }}
                      disabled={
                        update.isPending || app.status === "withdrawn"
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs rounded-lg">
                        <SelectValue placeholder={t("changeStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_STATUS_TRANSITIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {t(`appStatus.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setDetailApp(app)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {t("viewDetail")}
                    </Button>
                    {!TERMINAL_STATUSES.has(app.status) ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setInterviewApp(app)}
                      >
                        <CalendarClock className="w-3 h-3 mr-1" />
                        {t("scheduleInterview")}
                      </Button>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <ApplicantDetailDialog
        applicant={detailApp}
        onClose={() => setDetailApp(null)}
      />
      <InterviewScheduleDialog
        open={interviewApp !== null}
        applicationId={interviewApp?.applicationId ?? 0}
        applicantName={interviewApp?.displayName ?? ""}
        onClose={() => setInterviewApp(null)}
      />
    </>
  )
}
