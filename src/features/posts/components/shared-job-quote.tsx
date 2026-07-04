"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { BadgeCheck, Briefcase, MapPin, Send } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatLocation, formatSalary } from "@/features/jobs/lib/format"
import { useRelativeTime } from "@/lib/utils/use-relative-time"

import type { SharedJobPreview } from "../types"

export function SharedJobQuote({ job }: { job: SharedJobPreview }) {
  const tFeed = useTranslations("feed")
  const tJobs = useTranslations("jobs.public")
  const createdRel = useRelativeTime(job.createdAt)
  const salary = formatSalary(job)
  const location = formatLocation(job)

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Link href={`/company/${job.companyUserId}`} className="shrink-0">
            <Avatar className="h-10 w-10 rounded-xl border border-border/40 hover:opacity-80 transition-opacity">
              {job.companyLogoUrl ? (
                <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
              ) : null}
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                <Briefcase className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/company/${job.companyUserId}`}
              className="inline-flex max-w-full items-center gap-1 font-headline text-[13px] font-bold text-foreground hover:text-primary transition-colors"
            >
              <span className="truncate">{job.companyName}</span>
              {job.companyVerified ? (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : null}
            </Link>
            <p className="mt-1 flex items-center text-[10px] text-muted-foreground sm:text-[11px]">
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <Briefcase className="h-3 w-3" /> {tFeed("jobRecruiting")}
              </span>
              {createdRel ? (
                <>
                  <span className="mx-1">•</span>
                  {createdRel}
                </>
              ) : null}
            </p>
          </div>
        </div>

        <Link href={`/jobs/${job.id}`} className="group mt-4 block">
          <h3 className="font-headline text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
            {job.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
          {location ? (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {location}
            </span>
          ) : null}
          {job.jobTypeName ? <DotText label={job.jobTypeName} /> : null}
          {job.workModeName ? <DotText label={job.workModeName} /> : null}
          {salary ? (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {salary}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/30 px-3 py-2 sm:px-4">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Send className="h-3.5 w-3.5" />
          {tJobs("viewDetails")}
        </Link>
      </div>
    </div>
  )
}

function DotText({ label }: { label: string }) {
  return (
    <>
      <span className="h-1 w-1 rounded-full bg-border" />
      <span>{label}</span>
    </>
  )
}
