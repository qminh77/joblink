"use client"

import { useOptimistic, startTransition, useState } from "react"
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
      <div className="pb-2 border-b border-border/40">
        <h1 className="font-headline font-bold text-xl text-foreground">
          {t("savedHeading")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("savedSubheading", { count: data.total })}
        </p>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-card border-border/40 rounded-2xl p-12 text-center">
          <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {t("savedEmpty")}
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
          >
            {t("browseJobs")}
          </Link>
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
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            type="button"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {t("prevPage")}
          </button>
          <span className="text-xs text-muted-foreground px-2">
            {t("pagination", { current: page + 1, total: totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1 || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {t("nextPage")}
          </button>
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
  
  const [optimisticSaved, addOptimisticSaved] = useOptimistic(
    true,
    (_state, nextSaved: boolean) => nextSaved
  )

  const toggle = useToggleSavedJob()

  const salary = formatSalary(job)
  const location = formatLocation(job)

  return (
    <Card className="bg-card border-border/40 rounded-2xl p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="w-11 h-11 rounded-lg shrink-0">
          {job.companyLogoUrl ? (
            <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
          ) : null}
          <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
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
                const nextSaved = !optimisticSaved
                startTransition(async () => {
                  addOptimisticSaved(nextSaved)
                  await toggle.mutateAsync(job.id).catch(() => {})
                })
              }}
              className={`p-1.5 rounded-full hover:bg-muted/60 transition-colors ${
                optimisticSaved ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={optimisticSaved ? t("unsave") : t("save")}
            >
              <Bookmark className={`w-4 h-4 ${optimisticSaved ? "fill-current" : ""}`} />
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
