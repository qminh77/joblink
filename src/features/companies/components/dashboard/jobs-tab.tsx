"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase, Loader2, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { slideLeft, staggerSm } from "@/lib/animations"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { useCompanyJobs, useUpdateJobStatus } from "../../hooks"
import type { DashboardJobsPage, JobStatusFilter } from "../../types"

import { JOB_STATUS_TONE } from "./shared"

type Props = {
  initialData: DashboardJobsPage
}

const STATUS_OPTIONS: JobStatusFilter[] = [
  "all",
  "active",
  "draft",
  "closed",
  "expired",
]

export function JobsTab({ initialData }: Props) {
  const t = useTranslations("companies.dashboard")
  const formatRel = useRelativeTimeFormatter()

  const [status, setStatus] = useState<JobStatusFilter>("all")
  const [search, setSearch] = useState("")

  const { data, isFetching } = useCompanyJobs({
    status,
    search,
    limit: 20,
    offset: 0,
    initialData,
  })

  const updateStatus = useUpdateJobStatus()
  const items = data?.items ?? []

  return (
    <Card className="border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
      <div className="flex flex-wrap items-center gap-2 p-4 pb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 rounded-full bg-muted border-none text-sm"
            placeholder={t("searchJobsPlaceholder")}
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
              {t(`jobsFilter.${s}`)}
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
            {t("emptyJobs")}
          </div>
        ) : (
          <motion.div
            variants={staggerSm}
            initial="hidden"
            animate="show"
            className="divide-y divide-border/30"
          >
            {items.map((job) => (
              <motion.div
                key={job.id}
                variants={slideLeft}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold border-0 ${JOB_STATUS_TONE[job.status]}`}
                  >
                    {t(`jobStatus.${job.status}`)}
                  </Badge>
                  {job.status === "draft" || job.status === "closed" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate({
                          jobId: job.id,
                          newStatus: "active",
                        })
                      }
                    >
                      {t("publish")}
                    </Button>
                  ) : job.status === "active" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus.mutate({
                          jobId: job.id,
                          newStatus: "closed",
                        })
                      }
                    >
                      {t("close")}
                    </Button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
