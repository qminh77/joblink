import { loadAdminDashboard } from "@/features/admin/api/dashboard"
import { DashboardPanel } from "@/features/admin/components/dashboard-panel"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const data = await loadAdminDashboard()
  return <DashboardPanel data={data} />
}
