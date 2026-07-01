import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminPermission } from "./admin-guard"
import { loadDashboardData } from "../services/dashboard.service"
import type { AdminDashboardData } from "../types"

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  await requireAdminPermission("dashboard.view")
  const supabase = createAdminClient()
  return loadDashboardData(supabase)
}
