"use client"

import { useTranslations } from "next-intl"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { POST_TYPES } from "@/features/posts/lib/constants"
import { ADMIN_POST_STATUSES } from "../../lib/post-moderation"

export function PostFilters({
  count,
  onFilterChange,
  onSearchChange,
  onSearchSubmit,
  query,
  search,
}: {
  count: number
  onFilterChange: (key: string, value?: string) => void
  onSearchChange: (value: string) => void
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  query: { type?: string; status?: string; search?: string }
  search: string
}) {
  const t = useTranslations("admin.posts")
  const tTypes = useTranslations("admin.posts.types")
  const tStatuses = useTranslations("admin.posts.statuses")

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
      <Select
        value={query.type ?? "all"}
        onValueChange={(value) => onFilterChange("type", value)}
      >
        <SelectTrigger className="w-44 rounded-lg">
          <SelectValue placeholder={t("filterType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          {POST_TYPES.map((postType) => (
            <SelectItem key={postType} value={postType}>
              {tTypes(postType)}
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
          {ADMIN_POST_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {tStatuses(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground self-center">
        {t("total", { count })}
      </p>
    </div>
  )
}
