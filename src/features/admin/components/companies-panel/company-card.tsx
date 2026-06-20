"use client"

import { useFormatter, useTranslations } from "next-intl"
import { Check, ExternalLink, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"
import type { AdminCompanyRow } from "../../types"
import { verificationColor, type CompanyAction } from "./constants"

export function CompanyCard({
  company,
  onAction,
  pending,
}: {
  company: AdminCompanyRow
  onAction: (company: AdminCompanyRow, action: CompanyAction) => void
  pending: boolean
}) {
  const t = useTranslations("admin.companies")
  const tStatuses = useTranslations("admin.companies.statuses")
  const format = useFormatter()

  return (
    <Card className="bg-transparent border-none shadow-none rounded-xl p-5">
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <Avatar className="w-12 h-12 rounded-xl">
            {company.logoUrl ? <AvatarImage src={company.logoUrl} /> : null}
            <AvatarFallback className="rounded-xl bg-primary/10">
              {getInitials(company.name, "CO")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{company.name}</h3>
              <Badge
                variant="outline"
                className={`text-xs ${verificationColor(
                  company.verificationStatus,
                )}`}
              >
                {tStatuses(company.verificationStatus)}
              </Badge>
              <a
                href={`/company/${company.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
              >
                {t("viewDetail")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <DetailItem label={t("fields.taxId")} value={company.taxId} />
              <DetailItem
                label={t("fields.representative")}
                value={company.representativeName}
              />
              <DetailItem
                label={t("fields.businessEmail")}
                value={company.businessEmail}
              />
              <DetailItem
                label={t("fields.businessAddress")}
                value={company.businessAddress}
              />
              <DetailItem
                label={t("fields.industry")}
                value={company.industry}
              />
              <DetailItem
                label={t("fields.submitted")}
                value={format.dateTime(new Date(company.submittedAt), {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
            </dl>
            {company.verificationNote ? (
              <p className="mt-2 text-xs text-amber-600">
                &ldquo;{company.verificationNote}&rdquo;
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {company.verificationStatus === "pending" ||
          company.verificationStatus === "pending_update" ? (
            <>
              <Button
                size="sm"
                className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                disabled={pending}
                onClick={() => onAction(company, "approve")}
              >
                <Check className="w-4 h-4 mr-1" />
                {t("approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-red-500/30 text-red-500"
                disabled={pending}
                onClick={() => onAction(company, "reject")}
              >
                <X className="w-4 h-4 mr-1" />
                {t("reject")}
              </Button>
            </>
          ) : null}
          {company.verificationStatus === "verified" ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={pending}
              onClick={() => onAction(company, "suspend")}
            >
              {t("suspend")}
            </Button>
          ) : null}
          {company.verificationStatus === "rejected" ||
          company.verificationStatus === "suspended" ? (
            <Button
              size="sm"
              className="rounded-lg"
              disabled={pending}
              onClick={() => onAction(company, "restore")}
            >
              {t("restore")}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex gap-1">
      <dt className="font-medium text-foreground/80">{label}:</dt>
      <dd className="truncate">{value}</dd>
    </div>
  )
}
