"use client"

import { useTranslations } from "next-intl"
import { Flag } from "lucide-react"

import type { AdminReportRow } from "@/features/admin/types"
import { ModerationDialog } from "./reports-panel/moderation-dialog"
import { ReportCard } from "./reports-panel/report-card"
import { ReportFilters } from "./reports-panel/report-filters"
import { useReportsPanel } from "./reports-panel/use-reports-panel"

export function ReportsPanel({
  items,
  query,
}: {
  items: AdminReportRow[]
  query: { targetType?: string; status?: string }
}) {
  const t = useTranslations("admin.reports")
  const {
    actionType,
    closeActionDialog,
    openActionDialog,
    openTarget,
    pending,
    quickStatus,
    reason,
    setActionType,
    setReason,
    submitAction,
    updateParam,
  } = useReportsPanel()

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <ReportFilters
        count={items.length}
        onFilterChange={updateParam}
        query={query}
      />

      <div className="flex flex-col">
        {items.length === 0 ? (
          <div className="bg-transparent border-none shadow-none rounded-xl p-8 text-center">
            <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          items.map((report) => (
            <ReportCard
              key={report.id}
              onOpenAction={openActionDialog}
              onQuickStatus={quickStatus}
              pending={pending}
              report={report}
            />
          ))
        )}
      </div>

      <ModerationDialog
        actionType={actionType}
        onActionTypeChange={setActionType}
        onClose={closeActionDialog}
        onReasonChange={setReason}
        onSubmit={submitAction}
        openTarget={openTarget}
        pending={pending}
        reason={reason}
      />
    </>
  )
}
