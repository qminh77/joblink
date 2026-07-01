"use client"

import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JOB_STATUSES } from "@/lib/constants"

export function JobFilters({
  search,
  status,
  total,
  onSearchChange,
  onSearchSubmit,
  onStatusChange,
}: {
  search: string
  status?: string
  total: number
  onSearchChange: (value: string) => void
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onStatusChange: (value: string) => void
}) {
  const t = useTranslations("admin.jobs")
  const tStatuses = useTranslations("admin.jobs.statuses")

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <form onSubmit={onSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9 h-10 rounded-lg bg-transparent border-none shadow-none text-sm"
        />
      </form>
      <Select value={status ?? "all"} onValueChange={onStatusChange}>
        <SelectTrigger className="w-44 rounded-lg">
          <SelectValue placeholder={t("filterStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatuses")}</SelectItem>
          {JOB_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {tStatuses(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground self-center">
        {t("total", { count: total })}
      </p>
    </div>
  )
}
