"use client"

import { useTranslations } from "next-intl"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REPORT_STATUSES, REPORT_TARGET_TYPES } from "@/lib/constants"

export function ReportFilters({
  count,
  onFilterChange,
  query,
}: {
  count: number
  onFilterChange: (key: string, value: string | undefined) => void
  query: { targetType?: string; status?: string }
}) {
  const t = useTranslations("admin.reports")
  const tStatuses = useTranslations("admin.reports.statuses")
  const tTypes = useTranslations("admin.reports.types")

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={query.targetType ?? "all"}
        onValueChange={(value) => onFilterChange("type", value)}
      >
        <SelectTrigger className="w-44 rounded-lg">
          <SelectValue placeholder={t("filterType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          {REPORT_TARGET_TYPES.map((targetType) => (
            <SelectItem key={targetType} value={targetType}>
              {tTypes(targetType)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={query.status ?? "all"}
        onValueChange={(value) => onFilterChange("status", value)}
      >
        <SelectTrigger className="w-44 rounded-lg">
          <SelectValue placeholder={t("filterStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
          {REPORT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {tStatuses(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        {t("total", { count })}
      </p>
    </div>
  )
}
