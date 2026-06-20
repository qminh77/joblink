"use client"

import { useFormatter, useTranslations } from "next-intl"
import { ExternalLink, MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AdminReportRow } from "@/features/admin/types"
import type { ReportStatus } from "@/lib/constants"
import { getInitials } from "@/lib/utils/format"
import { STATUS_STYLE, TARGET_ICON } from "./constants"

export function ReportCard({
  onOpenAction,
  onQuickStatus,
  pending,
  report,
}: {
  onOpenAction: (report: AdminReportRow) => void
  onQuickStatus: (report: AdminReportRow, status: ReportStatus) => void
  pending: boolean
  report: AdminReportRow
}) {
  const t = useTranslations("admin.reports")
  const tStatuses = useTranslations("admin.reports.statuses")
  const tTypes = useTranslations("admin.reports.types")
  const format = useFormatter()
  const Icon = TARGET_ICON[report.targetType]

  return (
    <div className="py-4 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors px-2 rounded-lg -mx-2">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0 mt-0.5 border border-border/30">
          {report.reporterAvatar ? (
            <AvatarImage src={report.reporterAvatar} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
            {getInitials(report.reporterName, "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm">
                <span className="font-semibold text-foreground hover:underline cursor-pointer">{report.reporterName}</span>
                <span className="text-muted-foreground"> {t("reportedThe")} </span>
                <span className="font-medium text-foreground lowercase">{tTypes(report.targetType)}</span>
                <span className="text-muted-foreground"> {t("forReason")} </span>
                <span className="font-semibold text-destructive">{report.reasonName}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>
                  {format.dateTime(new Date(report.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span>•</span>
                <span className={`font-medium ${STATUS_STYLE[report.status]}`}>
                  {tStatuses(report.status)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {report.status === "pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => onQuickStatus(report, "in_review")}
                >
                  {t("actionMarkReview")}
                </Button>
              ) : null}
              {report.status !== "dismissed" && report.status !== "resolved" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onQuickStatus(report, "dismissed")}
                >
                  {t("actionDismiss")}
                </Button>
              ) : null}
              <Button
                size="sm"
                disabled={pending}
                onClick={() => onOpenAction(report)}
              >
                {t("actionTake")}
              </Button>
            </div>
          </div>

          {report.description ? (
            <div className="mt-2 text-sm text-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/40">
              <p className="whitespace-pre-line leading-relaxed italic">&ldquo;{report.description}&rdquo;</p>
            </div>
          ) : null}

          <div className="mt-3 pl-3.5 border-l-2 border-primary/30 py-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-foreground">
                {report.targetPreview.label}
              </span>
              <span>#{report.targetId}</span>
              {report.targetAuthorName ? (
                <>
                  <span>•</span>
                  <span>{t("targetAuthor")}: </span>
                  <span className="font-medium text-foreground">
                    {report.targetAuthorName}
                  </span>
                </>
              ) : null}
              {report.targetPreview.url ? (
                <a
                  href={report.targetPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline ml-1"
                >
                  {t("viewDetails")} <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </div>
            {report.targetPreview.snippet ? (
              <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">
                {report.targetPreview.snippet}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">{t("noPreview")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
