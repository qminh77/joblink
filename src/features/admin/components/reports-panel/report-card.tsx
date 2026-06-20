"use client"

import { useFormatter, useTranslations } from "next-intl"
import { ExternalLink, MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-9 h-9 shrink-0 mt-0.5 border border-border/30">
            {report.reporterAvatar ? (
              <AvatarImage src={report.reporterAvatar} />
            ) : null}
            <AvatarFallback className="text-[11px]">
              {getInitials(report.reporterName, "?")}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs gap-1">
                    <Icon className="w-3 h-3" />
                    {tTypes(report.targetType)}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">
                    {report.reasonName}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_STYLE[report.status]}`}
                  >
                    {tStatuses(report.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("reportedBy")}{" "}
                  <span className="font-medium text-foreground">
                    {report.reporterName}
                  </span>
                  {" - "}
                  {format.dateTime(new Date(report.createdAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
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
                {report.status !== "dismissed" &&
                report.status !== "resolved" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
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

            <div className="rounded-lg bg-muted/50 border border-border/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-foreground">
                  {report.targetPreview.label}
                </span>
                <span className="text-muted-foreground/60">
                  #{report.targetId}
                </span>
                {report.targetAuthorName ? (
                  <>
                    <span className="text-muted-foreground/40">-</span>
                    <span className="text-muted-foreground">
                      {t("targetAuthor")}:{" "}
                    </span>
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
                    className="inline-flex items-center gap-0.5 text-primary hover:underline ml-auto"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
              {report.targetPreview.snippet ? (
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                  {report.targetPreview.snippet}
                </p>
              ) : null}
            </div>

            {report.description ? (
              <div className="flex items-start gap-2 text-sm">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-foreground/70 whitespace-pre-line leading-relaxed line-clamp-3">
                  &ldquo;{report.description}&rdquo;
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}
