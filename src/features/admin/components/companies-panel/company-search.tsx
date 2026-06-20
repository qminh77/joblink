"use client"

import { Search } from "lucide-react"
import { useTranslations } from "next-intl"

import { Input } from "@/components/ui/input"

export function CompanySearch({
  onSearchChange,
  onSearchSubmit,
  search,
}: {
  onSearchChange: (value: string) => void
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  search: string
}) {
  const t = useTranslations("admin.companies")

  return (
    <form onSubmit={onSearchSubmit} className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="pl-9 h-10 rounded-lg bg-transparent border-none shadow-none text-sm"
      />
    </form>
  )
}
