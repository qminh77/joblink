"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import {
  ExternalLink,
  Flag,
  MessageSquare,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { getInitials } from "@/lib/utils/format"
import type { ModerationActionType } from "@/types/database"

const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-border/30",
}

const TARGET_ICON: Record<ReportTargetType, typeof Flag> = {
  user: User,
  post: Flag,
  comment: MessageSquare,
  job: Flag,
  company: Flag,
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
            const Icon = TARGET_ICON[r.targetType]
            return (
              <Card
                key={r.id}
                className="bg-card border-border/30 rounded-xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-9 h-9 shrink-0 mt-0.5 border border-border/30">
                      {r.reporterAvatar ? (
                        <AvatarImage src={r.reporterAvatar} />
                      ) : null}
                      <AvatarFallback className="text-[11px]">
                        {getInitials(r.reporterName, "?")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs gap-1">
                              <Icon className="w-3 h-3" />
                              {tTypes(r.targetType)}
                            </Badge>
                            <span className="text-sm font-medium text-foreground">
                              {r.reasonName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${STATUS_STYLE[r.status]}`}
                            >
                              {tStatuses(r.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("reportedBy")}{" "}
                            <span className="font-medium text-foreground">
                              {r.reporterName}
                            </span>
                            {" • "}
                            {format.dateTime(new Date(r.createdAt), {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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

                      <div className="rounded-lg bg-muted/50 border border-border/20 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium text-foreground">
                            {r.targetPreview.label}
                          </span>
                          <span className="text-muted-foreground/60">
                            #{r.targetId}
                          </span>
                          {r.targetAuthorName ? (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="text-muted-foreground">
                                {t("targetAuthor")}:{" "}
                              </span>
                              <span className="font-medium text-foreground">
                                {r.targetAuthorName}
                              </span>
                            </>
                          ) : null}
                          {r.targetPreview.url ? (
                            <a
                              href={r.targetPreview.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-primary hover:underline ml-auto"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null}
                        </div>
                        {r.targetPreview.snippet ? (
                          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                            {r.targetPreview.snippet}
                          </p>
                        ) : null}
                      </div>

                      {r.description ? (
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-foreground/70 whitespace-pre-line leading-relaxed line-clamp-3">
                            &ldquo;{r.description}&rdquo;
                          </p>
                        </div>
                      ) : null}
                    </div>
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
                ? `${tTypes(openTarget.targetType)} #${openTarget.targetId} — ${openTarget.reasonName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {openTarget?.description ? (
            <Card className="bg-muted/30 border-border/20 rounded-lg p-3 text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              &ldquo;{openTarget.description}&rdquo;
            </Card>
          ) : null}
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
