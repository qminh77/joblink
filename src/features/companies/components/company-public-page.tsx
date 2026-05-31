"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Globe,
  Info,
  LayoutDashboard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserSquare,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { SectionCard } from "@/features/profile/components/section-card"
import { fadeUp, pageEntrance, staggerMd } from "@/lib/animations"
import { formatRelativeTime } from "@/lib/utils/format"
import { useTranslations } from "next-intl"

import type { CompanyPublicOverview, CompanyActiveJobPreview } from "../types"

import { CompanyFollowButton } from "./company-follow-button"
import { ProfilePostsSection } from "@/features/profile/components/profile-posts-section"
import type { UserPostsPage } from "@/features/posts/types"

type Props = {
  overview: CompanyPublicOverview
  postsPage: UserPostsPage
}

const numberFormatter = new Intl.NumberFormat("vi-VN")

function formatSalary(job: CompanyActiveJobPreview): string | null {
  if (!job.salaryVisible) return null
  const min = job.salaryMin
  const max = job.salaryMax
  if (min == null && max == null) return null
  if (min != null && max != null) {
    return `${numberFormatter.format(min)} – ${numberFormatter.format(max)}`
  }
  return numberFormatter.format(min ?? max ?? 0)
}

export function CompanyPublicPage({ overview, postsPage }: Props) {
  const t = useTranslations("companies.public")
  const { company, jobsCount, followerCount, isFollowing, isOwner, jobs } =
    overview

  const isVerified = company.verificationStatus === "verified"

  const location = [company.districtName, company.provinceName]
    .filter(Boolean)
    .join(", ")

  const hasContact =
    !!company.businessEmail ||
    !!company.phone ||
    !!company.businessAddress ||
    !!company.representativeName

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden rounded-2xl bg-card border-border/40 p-0 gap-0">
          <div className="h-36 sm:h-44 bg-gradient-to-r from-primary/80 to-blue-400" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4 min-w-0">
                <Avatar className="w-24 h-24 rounded-2xl border-4 border-card -mt-12 shrink-0">
                  {company.logoUrl ? (
                    <AvatarImage
                      src={company.logoUrl}
                      alt={company.name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-2xl bg-muted text-muted-foreground">
                    <Building2 className="w-9 h-9" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground break-words">
                      {company.name}
                    </h1>
                    {isVerified ? (
                      <Badge
                        variant="outline"
                        className="border-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs gap-1"
                      >
                        <BadgeCheck className="w-3 h-3" />
                        {t("verified")}
                      </Badge>
                    ) : null}
                    {company.openToHire ? (
                      <Badge
                        variant="outline"
                        className="border-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-xs"
                      >
                        {t("openToHire")}
                      </Badge>
                    ) : null}
                  </div>
                  {company.industry ? (
                    <p className="text-sm text-muted-foreground">
                      {company.industry}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {location ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {location}
                      </span>
                    ) : null}
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:opacity-80 transition-opacity"
                      >
                        <Globe className="w-3.5 h-3.5" /> {t("website")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwner ? (
                  <>
                    <Link
                      href="/company/dashboard"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      {t("dashboard")}
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {t("editProfile")}
                    </Link>
                  </>
                ) : (
                  <CompanyFollowButton
                    companyUserId={company.userId}
                    initialIsFollowing={isFollowing}
                    initialFollowerCount={followerCount}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {numberFormatter.format(jobsCount)} {t("statJobs")}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {numberFormatter.format(followerCount)} {t("statFollowers")}
              </span>
              {company.size ? (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {company.size} {t("statEmployees")}
                </span>
              ) : null}
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={staggerMd}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        <div className="lg:col-span-2 space-y-5">
          {company.about ? (
            <motion.div variants={fadeUp}>
              <SectionCard
                title={t("about")}
                icon={<Info className="w-4 h-4 text-muted-foreground" />}
              >
                <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                  {company.about}
                </p>
              </SectionCard>
            </motion.div>
          ) : null}

          <motion.div variants={fadeUp}>
            <SectionCard
              title={t("activeJobsHeading", { count: jobsCount })}
              icon={<Briefcase className="w-4 h-4 text-muted-foreground" />}
              empty={jobs.length === 0}
              emptyMessage={t("noActiveJobs")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobs.map((job) => {
                  const jobLocation = [job.districtName, job.provinceName]
                    .filter(Boolean)
                    .join(", ")
                  const salary = formatSalary(job)
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="group rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-border transition-colors p-4 flex flex-col"
                    >
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {job.title}
                      </h3>
                      <div className="mt-2 space-y-1 flex-1">
                        {jobLocation ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{jobLocation}</span>
                          </div>
                        ) : null}
                        {job.jobTypeName || job.workModeName ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {[job.jobTypeName, job.workModeName]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </div>
                        ) : null}
                        {salary ? (
                          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {salary}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                        {formatRelativeTime(job.createdAt)}
                      </div>
                    </Link>
                  )
                })}
              </div>
              {jobsCount > jobs.length ? (
                <div className="mt-4 text-center">
                  <Link
                    href={`/jobs?company=${company.userId}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t("viewAllJobs")}
                  </Link>
                </div>
              ) : null}
            </SectionCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ProfilePostsSection
              targetUserId={company.userId}
              isOwner={isOwner}
              initialPage={postsPage}
            />
          </motion.div>
        </div>

        <div className="space-y-5">
          {hasContact ? (
            <motion.div variants={fadeUp}>
              <SectionCard
                title={t("contactHeading")}
                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              >
                <div className="space-y-3 text-sm">
                  {company.businessEmail ? (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                      <a
                        href={`mailto:${company.businessEmail}`}
                        className="text-foreground hover:text-primary transition-colors break-all"
                      >
                        {company.businessEmail}
                      </a>
                    </div>
                  ) : null}
                  {company.phone ? (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0 mt-0.5" />
                      <a
                        href={`tel:${company.phone}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {company.phone}
                      </a>
                    </div>
                  ) : null}
                  {company.businessAddress ? (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-foreground/90">
                        {company.businessAddress}
                      </span>
                    </div>
                  ) : null}
                  {company.representativeName ? (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <UserSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="text-foreground/90">
                        {t("representativeLabel")}: {company.representativeName}
                        {company.representativeTitle
                          ? ` · ${company.representativeTitle}`
                          : ""}
                      </span>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  )
}
