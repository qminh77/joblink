"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Clock, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminAuditLogEntry } from "@/features/admin/types"
import { AuditEntryRow } from "./audit-entry-row"
import { DateSeparator } from "./date-separator"
import { formatActionLabel, groupByDate } from "./utils"

export function AuditPanel({
  entries,
  nextCursor,
  total,
  actions,
  entityTypes,
  query,
}: {
  entries: AdminAuditLogEntry[]
  nextCursor: number | null
  total: number
  actions: string[]
  entityTypes: string[]
  query: { search?: string; action?: string; entityType?: string }
}) {
  const t = useTranslations("admin.audit")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(searchParams.toString())
      if (!value || value === "all") next.delete(key)
      else next.set(key, value)
      // Reset cursor when filters change
      next.delete("cursor")
      startTransition(() =>
        router.replace(`/admin/audit-log?${next.toString()}`),
      )
    },
    [router, searchParams],
  )

  const loadMore = useCallback(() => {
    if (!nextCursor) return
    const next = new URLSearchParams(searchParams.toString())
    next.set("cursor", String(nextCursor))
    startTransition(() =>
      router.push(`/admin/audit-log?${next.toString()}`),
    )
  }, [router, searchParams, nextCursor])

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  const groups = useMemo(() => groupByDate(entries), [entries])

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={onSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-lg bg-transparent border-none shadow-none text-sm"
          />
        </form>
        <Select
          value={query.action ?? "all"}
          onValueChange={(v) => updateParam("action", v)}
        >
          <SelectTrigger className="w-52 rounded-lg">
            <SelectValue placeholder={t("filterAction")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allActions")}</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {formatActionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.entityType ?? "all"}
          onValueChange={(v) => updateParam("entity", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterEntity")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allEntities")}</SelectItem>
            {entityTypes.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center whitespace-nowrap">
          {t("total", { count: total })}
        </p>
      </div>

      {/* Log entries grouped by date */}
      <div className="space-y-0">
        {entries.length === 0 ? (
          <Card className="bg-transparent border-none shadow-none rounded-xl p-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </Card>
        ) : (
          Array.from(groups.entries()).map(([date, dayEntries]) => (
            <div key={date}>
              <DateSeparator date={date} />
              <div className="space-y-1">
                {dayEntries.map((e) => (
                  <AuditEntryRow key={e.id} entry={e} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={pending}
            className="rounded-lg"
          >
            {pending ? t("loading", { defaultValue: "Loading..." }) : t("loadMore", { defaultValue: "Load more" })}
          </Button>
        </div>
      )}
    </>
  )
}
