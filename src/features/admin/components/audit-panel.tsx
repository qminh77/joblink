"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Clock, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export function AuditPanel({
  entries,
  actions,
  query,
}: {
  entries: AdminAuditLogEntry[]
  actions: string[]
  query: { search?: string; action?: string; entityType?: string }
}) {
  const t = useTranslations("admin.audit")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()
  const format = useFormatter()

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() =>
      router.replace(`/admin/audit-log?${next.toString()}`),
    )
  }

  const entityTypes = Array.from(
    new Set(entries.map((e) => e.entityType ?? "").filter(Boolean)),
  )

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

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
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {entityTypes.length > 0 && (
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
        )}
        <p className="text-sm text-muted-foreground self-center">
          {t("total", { count: entries.length })}
        </p>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <Card className="bg-transparent border-none shadow-none rounded-xl p-8 text-center">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </Card>
        ) : (
          entries.map((e) => (
            <Card
              key={e.id}
              className="bg-transparent border-none shadow-none rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">
                      {e.actorName ?? e.actorEmail ?? `user#${e.actorId ?? "?"}`}
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <Badge variant="outline" className="text-xs">
                      {e.action}
                    </Badge>
                    {e.entityType ? (
                      <span className="text-xs text-muted-foreground">
                        → {e.entityType}#{e.entityId ?? "—"}
                      </span>
                    ) : null}
                  </div>
                  {e.reason ? (
                    <p className="text-sm text-muted-foreground mt-1">
                      “{e.reason}”
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format.dateTime(new Date(e.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    {e.ipAddress ? <span>IP: {e.ipAddress}</span> : null}
                  </div>
                  {Boolean(e.oldData ?? e.newData) && (
                    <pre className="mt-2 text-[11px] bg-muted/50 px-3 py-2 rounded-lg whitespace-pre-wrap break-all text-muted-foreground">
                      {JSON.stringify(
                        { before: e.oldData, after: e.newData },
                        null,
                        2,
                      ) ?? ""}
                    </pre>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {pending ? null : null}
    </>
  )
}
