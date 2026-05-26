"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <>
      <div className="flex flex-wrap items-center gap-2">
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
              className="rounded-full h-8 text-xs"
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

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
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
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
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
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${JOB_STATUS_TONE[job.status]}`}
                  >
                    {t(`jobStatus.${job.status}`)}
                  </span>
                  {job.status === "draft" || job.status === "closed" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] rounded-lg"
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
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] rounded-lg"
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
      </Card>
    </>
  )
}

