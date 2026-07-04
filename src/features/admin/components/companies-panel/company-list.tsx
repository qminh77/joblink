"use client"

import { Building2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import type { AdminCompanyRow } from "../../types"
import { CompanyCard } from "./company-card"
import type { CompanyAction } from "../../lib/company-verification"

export function CompanyList({
  items,
  onAction,
  pending,
}: {
  items: AdminCompanyRow[]
  onAction: (company: AdminCompanyRow, action: CompanyAction) => void
  pending: boolean
}) {
  const t = useTranslations("admin.companies")

  if (items.length === 0) {
    return (
      <Card className="bg-transparent border-none shadow-none rounded-xl p-8 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </Card>
    )
  }

  return items.map((company) => (
    <CompanyCard
      key={company.userId}
      company={company}
      onAction={onAction}
      pending={pending}
    />
  ))
}
