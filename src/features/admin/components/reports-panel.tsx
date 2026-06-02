"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Flag } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  applyModerationAction,
  setReportStatus,
} from "@/features/admin/api/reports"
import type { AdminReportRow } from "@/features/admin/types"
import {
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/constants"
import type { ModerationActionType } from "@/types/database"

const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-border/30",
}

const TARGET_HREF: Record<ReportTargetType, (id: number) => string | null> = {
  user: (id) => `/profile/${id}`,
  post: () => null,
  comment: () => null,
  job: (id) => `/jobs/${id}`,
  company: () => null,
}

const ACTION_TYPES: ModerationActionType[] = [
  "hide",
  "delete",
  "warn",
  "suspend",
  "ban",
  "restore",
  "dismiss",
]

export function ReportsPanel({
  items,
  query,
}: {
  items: AdminReportRow[]
  query: { targetType?: string; status?: string }
}) {
  const t = useTranslations("admin.reports")
  const tStatuses = useTranslations("admin.reports.statuses")
  const tTypes = useTranslations("admin.reports.types")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const format = useFormatter()

  const [openTarget, setOpenTarget] = useState<AdminReportRow | null>(null)
  const [actionType, setActionType] = useState<ModerationActionType>("hide")
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/reports?${next.toString()}`))
  }

  const quickStatus = (report: AdminReportRow, status: ReportStatus) => {
    startTransition(async () => {
      const result = await setReportStatus(report.id, status)
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(
        status === "dismissed" ? t("success.dismissed") : t("success.resolved"),
      )
      router.refresh()
    })
  }

  const submitAction = () => {
    if (!openTarget) return
    if (!reason.trim()) {
      toast.error(t("modActionReason"))
      return
    }
    startTransition(async () => {
      const result = await applyModerationAction({
        reportId: openTarget.id,
        actionType,
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(t("success.actionApplied"))
      setOpenTarget(null)
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

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={query.targetType ?? "all"}
          onValueChange={(v) => updateParam("type", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {REPORT_TARGET_TYPES.map((tt) => (
              <SelectItem key={tt} value={tt}>
                {tTypes(tt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {REPORT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatuses(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("total", { count: items.length })}
        </p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
            <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </Card>
        ) : (
          items.map((r) => {
            const targetHrefFn = TARGET_HREF[r.targetType]
            const targetHref = targetHrefFn ? targetHrefFn(r.targetId) : null
            return (
              <Card
                key={r.id}
                className="bg-card border-border/30 rounded-xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {tTypes(r.targetType)}
                      </Badge>
                      <span className="text-sm text-foreground font-medium">
                        {r.reasonName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLE[r.status]}`}
                      >
                        {tStatuses(r.status)}
                      </Badge>
                      {targetHref ? (
                        <a
                          href={targetHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          {t("viewTarget")} #{r.targetId}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          #{r.targetId}
                        </span>
                      )}
                    </div>
                    {r.description ? (
                      <p className="text-sm text-foreground mt-1.5 whitespace-pre-line">
                        {r.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("reportedBy")}{" "}
                      <span className="font-medium text-foreground">
                        {r.reporterName}
                      </span>
                      {" • "}
                      {format.dateTime(new Date(r.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {r.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => quickStatus(r, "in_review")}
                      >
                        {t("actionMarkReview")}
                      </Button>
                    )}
                    {r.status !== "dismissed" && r.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => quickStatus(r, "dismissed")}
                      >
                        {t("actionDismiss")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setOpenTarget(r)
                        setActionType("hide")
                        setReason("")
                      }}
                    >
                      {t("actionTake")}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog
        open={!!openTarget}
        onOpenChange={(open) => {
          if (!open) {
            setOpenTarget(null)
            setReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("modActionTitle")}</DialogTitle>
            <DialogDescription>
              {openTarget
                ? `${tTypes(openTarget.targetType)} #${openTarget.targetId}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1">
                {t("modActionType")}
              </label>
              <Select
                value={actionType}
                onValueChange={(v) => setActionType(v as ModerationActionType)}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">
                {t("modActionReason")}
              </label>
              <Textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setOpenTarget(null)
                setReason("")
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={submitAction}
              disabled={pending || !reason.trim()}
            >
              {pending ? t("submitting") : t("actionTake")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
