import { CompanyDashboardServer } from "@/features/companies/components/dashboard/dashboard-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function CompanyDashboardPage() {
  await requirePermission("jobs.edit")
  return <CompanyDashboardServer />
}
