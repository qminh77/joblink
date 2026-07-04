import { listAdminReports } from "@/features/admin/api/reports"
import { ReportsPanel } from "@/features/admin/components/reports-panel"
import {
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  type ReportStatus,
  type ReportTargetType,
} from "@/features/reports/lib/constants"

export const dynamic = "force-dynamic"

function asTargetType(v?: string): ReportTargetType | "all" | undefined {
  if (!v) return undefined
  if (v === "all" || (REPORT_TARGET_TYPES as readonly string[]).includes(v)) {
    return v as ReportTargetType | "all"
  }
  return undefined
}
function asStatus(v?: string): ReportStatus | "all" | undefined {
  if (!v) return undefined
  if (v === "all" || (REPORT_STATUSES as readonly string[]).includes(v)) {
    return v as ReportStatus | "all"
  }
  return undefined
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const targetType = asTargetType(
    typeof params.type === "string" ? params.type : undefined,
  )
  const status = asStatus(
    typeof params.status === "string" ? params.status : undefined,
  )
  const items = await listAdminReports({
    targetType: targetType ?? "all",
    status: status ?? "all",
  })
  return (
    <ReportsPanel
      items={items}
      query={{ targetType, status }}
    />
  )
}
