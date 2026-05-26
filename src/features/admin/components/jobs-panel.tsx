"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Briefcase, ExternalLink, RotateCcw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { applyJobAction, type AdminJobRow } from "@/features/admin/api/jobs"
import { JOB_STATUSES, type JobStatus } from "@/lib/constants"

const STATUS_STYLE: Record<JobStatus, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  expired: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  removed: "bg-red-500/10 text-red-600 border-red-500/20",
}

type Action = "remove" | "restore"

export function JobsPanel({
  items,
  query,
}: {
  items: AdminJobRow[]
  query: { status?: string; search?: string }
}) {
  const t = useTranslations("admin.jobs")
  const tStatuses = useTranslations("admin.jobs.statuses")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const format = useFormatter()

  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<
    { job: AdminJobRow; action: Action } | null
  >(null)
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
            className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
          />
        </form>
        <Select
          value={query.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatuses(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">
          {t("total", { count: items.length })}
        </p>
      </div>

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("company")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("filterStatus")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("applications")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("createdAt")}
                </th>
                <th className="text-right px-4 py-3 font-semibold">
                  {t("open")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-muted-foreground py-12"
                  >
                    <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                items.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {job.companyName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLE[job.status]}`}
                      >
                        {tStatuses(job.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {job.applicationsCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format.dateTime(new Date(job.createdAt), {
                        dateStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/jobs/${job.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {job.status !== "removed" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                            disabled={pending}
                            onClick={() =>
                              setConfirmTarget({ job, action: "remove" })
                            }
                            title={t("remove")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                            disabled={pending}
                            onClick={() =>
                              setConfirmTarget({ job, action: "restore" })
                            }
                            title={t("restore")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null)
            setReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget
                ? `${confirmTarget.action === "remove" ? t("remove") : t("restore")} — ${confirmTarget.job.title}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !reason.trim()}
              onClick={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              {pending ? t("submitting") : t("submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
