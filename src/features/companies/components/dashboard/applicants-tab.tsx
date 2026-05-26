"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Loader2, MessageCircle, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
  DashboardApplicantsPage,
  DashboardAppStatus,
} from "../../types"

import { APP_STATUS_TONE, APP_STATUS_TRANSITIONS } from "./shared"

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

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
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
              className="rounded-full h-8 text-xs"
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

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
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
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-10 h-10 shrink-0">
                    {app.avatarUrl ? (
                      <AvatarImage src={app.avatarUrl} alt={app.displayName} />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(app.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${app.applicantId}`}
                      className="font-semibold text-sm text-foreground hover:text-primary truncate block"
                    >
                      {app.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.headline ? `${app.headline} • ` : ""}
                      <Link
                        href={`/jobs/${app.jobId}`}
                        className="hover:text-primary"
                      >
                        {app.jobTitle}
                      </Link>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("appliedAt", { time: formatRel(app.appliedAt) })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${APP_STATUS_TONE[app.status]}`}
                  >
                    {t(`appStatus.${app.status}`)}
                  </span>
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
                    <SelectTrigger className="h-8 w-32 text-xs rounded-lg">
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
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    asChild
                  >
                    <Link href={`/profile/${app.applicantId}`}>
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {t("contact")}
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </>
  )
}
