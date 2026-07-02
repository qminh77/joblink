import "server-only"

// SRS UC Trace - M09 UC-61 Xem tong quan quan tri.
// Flow: /admin|/admin/dashboard -> dashboard API -> dashboard service/repo -> admin aggregate data.

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
import { loadDashboardData } from "../services/dashboard.service"
import type { AdminDashboardData } from "../types"

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadDashboardData(supabase)
}
