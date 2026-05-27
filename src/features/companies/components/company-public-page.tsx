import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Globe,
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { loadCompanyPublicOverview } from "../api/queries"
import type { CompanyActiveJobPreview } from "../types"

import { CompanyFollowButton } from "./company-follow-button"

type Props = {
  companyUserId: number
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

export async function CompanyPublicPage({ companyUserId }: Props) {
  const overview = await loadCompanyPublicOverview(companyUserId)
  if (!overview) notFound()

  const t = await getTranslations("companies.public")
  const { company, jobsCount, followerCount, isFollowing, isOwner, jobs } =
    overview

  const verificationLabel =
    company.verificationStatus === "verified" ? t("verified") : null

  const location = [company.districtName, company.provinceName]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
        <div className="h-40 bg-gradient-to-r from-primary/20 via-primary/5 to-purple-500/20" />
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
            <Avatar className="w-24 h-24 rounded-2xl border-4 border-card shadow-lg">
              {company.logoUrl ? (
                <AvatarImage src={company.logoUrl} alt={company.name} />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-primary/20 text-2xl font-bold">
                <Building2 className="w-10 h-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {company.name}
                </h1>
                {verificationLabel ? (
                  <Badge
                    variant="secondary"
                    className={`text-xs gap-1 ${
                      VERIFICATION_TONE[company.verificationStatus] ?? ""
                    }`}
                  >
                    <BadgeCheck className="w-3 h-3" />
                    {verificationLabel}
                  </Badge>
                ) : null}
                {company.openToHire ? (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs"
                  >
                    {t("openToHire")}
                  </Badge>
                ) : null}
              </div>
              {company.industry ? (
                <p className="text-muted-foreground text-sm mt-1">
                  {company.industry}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
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
            <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
              {isOwner ? (
                <>
                  <Button className="rounded-lg" asChild>
                    <Link href="/company/dashboard">
                      <LayoutDashboard className="w-4 h-4 mr-1.5" />
                      {t("dashboard")}
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-lg" asChild>
                    <Link href="/settings">
                      <Pencil className="w-4 h-4 mr-1.5" />
                      {t("editProfile")}
                    </Link>
                  </Button>
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

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-border/30 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">
                {numberFormatter.format(jobsCount)}
              </p>
              <p className="text-xs text-muted-foreground">{t("statJobs")}</p>
            </div>
            <div className="border-x border-border/30">
              <p className="text-xl font-bold text-foreground">
                {numberFormatter.format(followerCount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("statFollowers")}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {company.size ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("statEmployees")}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-card border-border/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-3">{t("about")}</h2>
        {company.about ? (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {company.about}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {t("aboutEmpty")}
          </p>
        )}
      </Card>

      <Card className="bg-card border-border/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          {t("contactHeading")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
            <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
              <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-foreground/90">
                {company.businessAddress}
              </span>
            </div>
          ) : null}
          {company.representativeName ? (
            <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
              <UserSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-foreground/90">
                {t("representativeLabel")}: {company.representativeName}
                {company.representativeTitle
                  ? ` · ${company.representativeTitle}`
                  : ""}
              </span>
            </div>
          ) : null}
          {!company.businessEmail &&
          !company.phone &&
          !company.businessAddress &&
          !company.representativeName ? (
            <p className="text-sm text-muted-foreground italic sm:col-span-2">
              {t("contactEmpty")}
            </p>
          ) : null}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">
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

        {jobs.length === 0 ? (
          <Card className="bg-card border-border/30 rounded-xl p-6 text-center">
            <Briefcase className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("noActiveJobs")}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const jobLocation = [job.districtName, job.provinceName]
                .filter(Boolean)
                .join(", ")
              const salary = formatSalary(job)
              return (
                <Card
                  key={job.id}
                  className="bg-card border-border/30 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {jobLocation ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {jobLocation}
                          </span>
                        ) : null}
                        {job.jobTypeName ? (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {job.jobTypeName}
                          </span>
                        ) : null}
                        {job.workModeName ? (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job.workModeName}
                          </span>
                        ) : null}
                        {salary ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {salary}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg shrink-0 text-xs"
                      asChild
                    >
                      <Link href={`/jobs/${job.id}`}>{t("jobDetails")}</Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
