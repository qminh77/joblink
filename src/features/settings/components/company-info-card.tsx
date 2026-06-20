"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Eye } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { SessionUserSummary } from "@/features/auth/types"
import { CompanyVerificationCard } from "@/features/companies/components/company-verification-card"
import { CompanyInfoForm } from "@/features/profile/components/edit/company-info-form"
import type { CompanyProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

export function CompanyInfoCard({
  user,
  company,
  provinces,
}: {
  user: SessionUserSummary
  company: CompanyProfileDetail
  provinces: ProvinceRow[]
}) {
  const t = useTranslations("settings")
  const initials = getInitials(company.name)
  const selfHref = profileHref(user.id, user.role)

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="relative overflow-hidden">
          {company.cover_url || user.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.cover_url || user.coverUrl || ""}
              alt=""
              className="h-20 sm:h-24 w-full object-cover bg-muted"
            />
          ) : (
            <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/15 to-primary/5" />
          )}
          <div className="px-0 -mt-10 sm:-mt-12">
            <div className="flex items-end gap-3 sm:gap-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-background">
                {user.avatarUrl || company.logo_url ? (
                  <AvatarImage
                    src={(user.avatarUrl || company.logo_url) ?? undefined}
                  />
                ) : null}
                <AvatarFallback className="text-base sm:text-lg font-semibold text-foreground bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="font-headline font-bold text-base sm:text-lg text-foreground truncate">
                  {company.name}
                </h2>
                {company.about ? (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {company.about}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={selfHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem trang công ty
          </Link>
        </div>
      </div>

      <CompanyVerificationCard
        status={company.verification_status}
        note={company.verification_note}
      />

      <div className="space-y-5">
        <h3 className="font-headline font-bold text-base text-foreground">
          {t("company.title")}
        </h3>
        <CompanyInfoForm company={company} provinces={provinces} />
      </div>
    </div>
  )
}
