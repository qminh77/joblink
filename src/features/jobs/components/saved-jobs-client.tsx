"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  Bookmark,
  Briefcase,
  Loader2,
  MapPin,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { fadeUp, pageEntrance, staggerSm } from "@/lib/animations"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { useMySavedJobs, useToggleSavedJob } from "../hooks"
import { formatLocation, formatSalary } from "../lib/format"
import type { SavedJobsPage } from "../types"

type Props = {
  initialData: SavedJobsPage
}

const PAGE_SIZE = 20

export function SavedJobsClient({ initialData }: Props) {
  const t = useTranslations("jobs.public")
  const formatRel = useRelativeTimeFormatter()
  const [page, setPage] = useState(0)

  const query = useMySavedJobs({
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    initialData: page === 0 ? initialData : undefined,
  })

  const data = query.data ?? { items: [], total: 0 }
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("savedHeading")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("savedSubheading", { count: data.total })}
        </p>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-card border-border/30 rounded-xl p-12 text-center">
          <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {t("savedEmpty")}
          </p>
          <Button asChild>
            <Link href="/jobs">{t("browseJobs")}</Link>
          </Button>
        </Card>
      ) : (
        <motion.div
          variants={staggerSm}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {data.items.map((job) => (
            <motion.div key={job.id} variants={fadeUp}>
              <SavedJobRow
                job={job}
                relTime={formatRel(job.savedAt)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t("prevPage")}
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            {t("pagination", { current: page + 1, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1 || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("nextPage")}
          </Button>
        </div>
      ) : null}
      {query.isFetching ? (
        <div className="flex justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : null}
    </motion.div>
  )
}

function SavedJobRow({
  job,
  relTime,
}: {
  job: SavedJobsPage["items"][number]
  relTime: string
}) {
  const t = useTranslations("jobs.public")
  const [saved, setSaved] = useState(true)
  const toggle = useToggleSavedJob({
    onRollback: () => setSaved((v) => !v),
  })

  const salary = formatSalary(job)
  const location = formatLocation(job)

  return (
    <Card className="bg-card border-border/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 rounded-lg shrink-0">
          {job.companyLogoUrl ? (
            <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
          ) : null}
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
            <Briefcase className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/jobs/${job.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
              >
                {job.title}
              </Link>
              <Link
                href={`/company/${job.companyUserId}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {job.companyName}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                if (toggle.isPending) return
                setSaved((v) => !v)
                toggle.mutate(job.id, {
                  onSuccess: (result) => {
                    if (result.ok) setSaved(result.saved)
                  },
                })
              }}
              className={`p-1.5 rounded-full hover:bg-muted transition-colors ${
                saved ? "text-primary" : "text-muted-foreground"
              }`}
              disabled={toggle.isPending}
              aria-label={saved ? t("unsave") : t("save")}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            {location ? (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            ) : null}
            {job.jobTypeName ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{job.jobTypeName}</span>
              </>
            ) : null}
            {salary ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {salary}
                </span>
              </>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {t("savedAt", { time: relTime })}
          </p>
        </div>
      </div>
    </Card>
  )
}
