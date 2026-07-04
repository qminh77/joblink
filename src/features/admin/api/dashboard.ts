import "server-only"

// SRS UC Trace - M09 UC-61 Xem tong quan quan tri.
// Flow: /admin|/admin/dashboard -> dashboard API -> dashboard service/repo -> admin aggregate data.

import { requireAdminClient } from "../services/admin-context.service"
import { loadDashboardData } from "../services/dashboard.service"
import type { AdminDashboardData } from "../types"

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const supabase = await requireAdminClient()
  return loadDashboardData(supabase)
}
