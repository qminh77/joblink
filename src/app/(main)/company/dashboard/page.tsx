import { CompanyDashboardServer } from "@/features/companies/components/dashboard/dashboard-page"

export const dynamic = "force-dynamic"

export default async function CompanyDashboardPage() {
  return <CompanyDashboardServer />
}
