"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  Shield,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

function groupByDate(
  entries: AdminAuditLogEntry[],
): Map<string, AdminAuditLogEntry[]> {
  const groups = new Map<string, AdminAuditLogEntry[]>()
  for (const e of entries) {
    const d = new Date(e.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const arr = groups.get(key) ?? []
    arr.push(e)
    groups.set(key, arr)
  }
  return groups
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  const week = Math.floor(day / 7)
  if (week < 4) return `${week}w`
  const month = Math.floor(day / 30)
  return `${month}mo`
}

function formatActionLabel(action: string): string {
  return action
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function ActionIcon({ action }: { action: string }) {
  if (action.includes("delete") || action.includes("remove") || action.includes("ban") || action.includes("suspend")) {
    return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
  }
  if (action.includes("create") || action.includes("add") || action.includes("register") || action.includes("send")) {
    return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
  }
  if (action.includes("update") || action.includes("edit") || action.includes("rename")) {
    return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
  }
  if (action.includes("restore") || action.includes("unblock") || action.includes("accept")) {
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
  }
  return <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
}

function DiffViewer({
  oldData,
  newData,
}: {
  oldData: unknown
  newData: unknown
}) {
  const [open, setOpen] = useState(false)

  const changes = useMemo(() => {
    if (!oldData && !newData) return []
    const before = (oldData ?? {}) as Record<string, unknown>
    const after = (newData ?? {}) as Record<string, unknown>
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return Array.from(keys)
      .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
      .map((k) => ({ key: k, from: before[k], to: after[k] }))
  }, [oldData, newData])

  if (changes.length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {changes.length} change{changes.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-muted">
          {changes.map(({ key, from, to }) => (
            <div key={key} className="text-[11px] text-muted-foreground flex gap-2">
              <span className="font-medium shrink-0 min-w-[60px]">{key}:</span>
              <span className="line-through text-red-400/70">
                {typeof from === "object" ? JSON.stringify(from) : String(from ?? "—")}
              </span>
              <span className="text-green-500/70">
                {typeof to === "object" ? JSON.stringify(to) : String(to ?? "—")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DateSeparator({ date }: { date: string }) {
  const t = useTranslations("admin.audit")
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (d.toDateString() === today.toDateString()) {
    label = t("today", { defaultValue: "Today" })
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = t("yesterday", { defaultValue: "Yesterday" })
  } else {
    label = d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

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
                  <div
                    key={e.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                  >
                    <div className="mt-0.5">
                      <ActionIcon action={e.action} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {e.actorId ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {e.actorName ?? e.actorEmail ?? `#${e.actorId}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <Shield className="w-3 h-3" />
                            system
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[11px] px-1.5 py-0 font-normal"
                        >
                          {formatActionLabel(e.action)}
                        </Badge>
                        {e.entityType ? (
                          <span className="text-xs text-muted-foreground">
                            {e.entityType}
                            {e.entityId != null ? `#${e.entityId}` : ""}
                          </span>
                        ) : null}
                        {e.reason ? (
                          <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                            &ldquo;{e.reason}&rdquo;
                          </span>
                        ) : null}
                      </div>
                      <DiffViewer oldData={e.oldData} newData={e.newData} />
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      <span title={new Date(e.createdAt).toLocaleString()}>
                        {relativeTime(e.createdAt)}
                      </span>
                      {e.ipAddress ? (
                        <span className="hidden sm:inline text-[10px]">
                          {e.ipAddress}
                        </span>
                      ) : null}
                    </div>
                  </div>
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
