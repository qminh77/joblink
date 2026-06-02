import { listReportTypes } from "@/features/admin/api/report-types"
import { ReportTypesPanel } from "@/features/admin/components/report-types-panel"

export const dynamic = "force-dynamic"

export default async function AdminReportTypesPage() {
  const items = await listReportTypes()
  return <ReportTypesPanel items={items} />
}
