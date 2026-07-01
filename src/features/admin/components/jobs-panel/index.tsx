"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { applyJobAction, type AdminJobRow } from "@/features/admin/api/jobs"
import { JobActionDialog } from "./job-action-dialog"
import { JobFilters } from "./job-filters"
import { JobsTable } from "./jobs-table"
import type { JobActionTarget } from "./types"

export function JobsPanel({
  items,
  query,
}: {
  items: AdminJobRow[]
  query: { status?: string; search?: string }
}) {
  const t = useTranslations("admin.jobs")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<JobActionTarget | null>(null)
  const [reason, setReason] = useState("")

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/jobs?${next.toString()}`))
  }

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  const submit = () => {
    if (!confirmTarget) return
    if (!reason.trim()) {
      toast.error(t("reason"))
      return
    }
    startTransition(async () => {
      const result = await applyJobAction({
        jobId: confirmTarget.job.id,
        action: confirmTarget.action,
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(
        confirmTarget.action === "remove"
          ? t("success.removed")
          : t("success.restored"),
      )
      setConfirmTarget(null)
      setReason("")
      router.refresh()
    })
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <JobFilters
        search={search}
        status={query.status}
        total={items.length}
        onSearchChange={setSearch}
        onSearchSubmit={onSearchSubmit}
        onStatusChange={(value) => updateParam("status", value)}
      />

      <JobsTable items={items} pending={pending} onAction={setConfirmTarget} />

      <JobActionDialog
        target={confirmTarget}
        reason={reason}
        pending={pending}
        onReasonChange={setReason}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null)
            setReason("")
          }
        }}
        onSubmit={submit}
      />
    </>
  )
}
