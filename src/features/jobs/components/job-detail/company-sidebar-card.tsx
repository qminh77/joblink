"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Building2, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

import type { JobDetail } from "../../types"

type CompanySidebarCardProps = {
  detail: JobDetail
}

export function CompanySidebarCard({ detail }: CompanySidebarCardProps) {
  const t = useTranslations("jobs.public")
  const { job } = detail

  return (
    <Card className="bg-card rounded-2xl p-6 text-center sticky top-24">
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 overflow-hidden">
        {job.companyLogoUrl ? (
          <Avatar className="w-16 h-16 rounded-xl">
            <AvatarImage src={job.companyLogoUrl} alt={job.companyName} />
            <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
              <Building2 className="w-7 h-7" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Building2 className="w-7 h-7 text-muted-foreground" />
        )}
      </div>
      <Link
        href={`/company/${job.companyUserId}`}
        className="font-headline text-lg font-bold text-foreground hover:text-primary transition-colors"
      >
        {job.companyName}
      </Link>
      <div className="mt-5 text-left space-y-3 pt-4 border-t border-border/20">
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">
            Ngành nghề
          </p>
          <p className="text-xs text-muted-foreground">
            {job.companyIndustry || "Chưa cập nhật"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Quy mô</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />{" "}
            {job.companySize || "Chưa cập nhật"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">
            Về công ty
          </p>
          <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
            {job.companyAbout || "Chưa có thông tin giới thiệu."}
          </p>
        </div>
      </div>
      <Link
        href={`/company/${job.companyUserId}`}
        className="inline-flex items-center justify-center w-full mt-4 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
      >
        {t("viewCompanyPage")}
      </Link>
    </Card>
  )
}
