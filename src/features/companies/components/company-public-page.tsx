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

const VERIFICATION_TONE: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  pending_update: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
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

  const verificationLabel =
    company.verificationStatus === "verified" ? t("verified") : null

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
          <div className="h-36 md:h-48 bg-gradient-to-r from-primary/20 via-primary/5 to-purple-500/20" />
          <div className="px-6 pb-4">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="flex items-end gap-5">
                <Avatar className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-card -mt-14 md:-mt-16">
                  {company.logoUrl ? (
                    <AvatarImage src={company.logoUrl} alt={company.name} />
                  ) : null}
                  <AvatarFallback className="rounded-2xl bg-muted text-muted-foreground">
                    <Building2 className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground break-words">
                      {company.name}
                    </h1>
                    {verificationLabel ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 border-0 ${
                          VERIFICATION_TONE[company.verificationStatus] ?? ""
                        }`}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        {verificationLabel}
                      </Badge>
                    ) : null}
                    {company.openToHire ? (
                      <Badge
                        variant="outline"
                        className="border-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 text-xs"
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
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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

              <div className="flex items-center gap-1 w-full md:w-auto justify-end">
                {isOwner ? (
                  <>
                    <Link
                      href="/company/dashboard"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t("dashboard")}
                    </Link>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
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

            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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
          <motion.div variants={fadeUp}>
            <ProfilePostsSection
              targetUserId={company.userId}
              isOwner={isOwner}
              initialPage={postsPage}
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-lg text-foreground">
                {t("activeJobsHeading", { count: jobsCount })}
              </h2>
              {jobsCount > jobs.length ? (
                <Link
                  href={`/jobs?company=${company.userId}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("viewAllJobs")}
                </Link>
              ) : null}
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            {jobs.length === 0 ? (
              <Card className="rounded-2xl bg-card border-border/40 p-8 text-center">
                <Briefcase className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t("noActiveJobs")}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const jobLocation = [job.districtName, job.provinceName]
                    .filter(Boolean)
                    .join(", ")
                  const salary = formatSalary(job)
                  return (
                    <Card
                      key={job.id}
                      className="rounded-2xl bg-card border-border/40 p-5 flex flex-col justify-between h-full group hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-headline font-bold text-base text-foreground group-hover:text-primary transition-colors"
                          >
                            {job.title}
                          </Link>
                        </div>
                        <div className="space-y-1.5 mb-4">
                          {jobLocation ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{jobLocation}</span>
                            </div>
                          ) : null}
                          {job.jobTypeName ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-3.5 h-3.5 shrink-0" />
                              <span>{job.jobTypeName}</span>
                            </div>
                          ) : null}
                          {job.workModeName ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span>{job.workModeName}</span>
                            </div>
                          ) : null}
                          {salary ? (
                            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              <span>{salary}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(job.createdAt)}
                        </span>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {t("jobDetails")}
                        </Link>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-5">
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

          {hasContact ? (
            <motion.div variants={fadeUp}>
              <SectionCard
                title={t("contactHeading")}
                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
              >
                <div className="space-y-3 text-sm">
                  {company.businessEmail ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <a
                        href={`mailto:${company.businessEmail}`}
                        className="text-foreground hover:text-primary transition-colors break-all"
                      >
                        {company.businessEmail}
                      </a>
                    </div>
                  ) : null}
                  {company.phone ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
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
