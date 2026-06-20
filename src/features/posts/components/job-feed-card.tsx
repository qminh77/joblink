"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  BadgeCheck,
  Bookmark,
  Briefcase,
  CheckCircle2,
  MapPin,
  Send,
  Share2,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { btnTap, fadeUp } from "@/lib/animations"
import { useRelativeTime } from "@/lib/utils/use-relative-time"
import { useToggleSavedJob } from "@/features/jobs/hooks"
import { formatLocation, formatSalary } from "@/features/jobs/lib/format"
import { JobShareModal } from "@/features/jobs/components/job-share-modal"

import type { FeedJob } from "../types"

type Props = {
  job: FeedJob
}

/**
 * Thẻ tin tuyển dụng trong feed home. Dùng chung ngôn ngữ thiết kế với PostCard
 * (rounded-2xl, header avatar + meta, action bar dưới) để feed đồng nhất, nhưng
 * nội dung là job: tiêu đề, lương, địa điểm, và CTA ứng tuyển dẫn tới /jobs/[id].
 */
export function JobFeedCard({ job }: Props) {
  const tFeed = useTranslations("feed")
  const tJobs = useTranslations("jobs.public")
  const createdRel = useRelativeTime(job.createdAt)

  const [saved, setSaved] = useState(job.viewerSaved)
  const [showShare, setShowShare] = useState(false)
  const toggle = useToggleSavedJob({
    onRollback: () => setSaved((v) => !v),
  })

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

  return (
    <motion.div variants={fadeUp}>
      <Card className="bg-card border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/company/${job.companyUserId}`} className="shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-border/40 hover:opacity-80 transition-opacity">
                  {job.companyLogoUrl ? (
                    <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
                  ) : null}
                  <AvatarFallback className="rounded-xl bg-primary/5 text-primary">
                    <Briefcase className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/company/${job.companyUserId}`}
                  className="font-headline font-bold text-foreground text-[13px] sm:text-sm hover:text-primary transition-colors leading-none mb-1 inline-flex items-center gap-1"
                >
                  <span className="truncate">{job.companyName}</span>
                  {job.companyVerified ? (
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : null}
                </Link>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center mt-1">
                  <span className="inline-flex items-center gap-1 text-primary font-semibold">
                    <Briefcase className="w-3 h-3" /> {tFeed("jobRecruiting")}
                  </span>
                  <span className="mx-1">•</span>
                  {createdRel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={toggle.isPending}
              className={`shrink-0 p-1.5 rounded-full hover:bg-muted/50 transition-colors ${
                saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={saved ? tJobs("unsave") : tJobs("save")}
            >
              <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>

          <Link href={`/jobs/${job.id}`} className="block mt-4 group">
            <h3 className="font-headline font-bold text-foreground text-base sm:text-lg leading-snug group-hover:text-primary transition-colors">
              {job.title}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] sm:text-xs text-muted-foreground">
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
            {job.workModeName ? (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{job.workModeName}</span>
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
        </div>

        <div className="px-1 sm:px-2 py-1 grid grid-cols-3 border-t border-border/30">
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <motion.span
              {...btnTap}
              className="w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <Briefcase className="w-4 h-4" />
              {tFeed("viewJobDetail")}
            </motion.span>
          </Link>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Share2 className="w-4 h-4" />
            {tFeed("share")}
          </motion.button>
          <Link href={`/jobs/${job.id}`} className="flex-1">
            <motion.span
              {...btnTap}
              className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] ${
                job.viewerApplied
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  : "text-primary hover:bg-primary/10"
              }`}
            >
              {job.viewerApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> {tJobs("applied")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> {tJobs("apply")}
                </>
              )}
            </motion.span>
          </Link>
        </div>
      </Card>

      <JobShareModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showShare}
        onClose={() => setShowShare(false)}
      />
    </motion.div>
  )
}
