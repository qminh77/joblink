import "server-only"

import { createClient } from "@/lib/supabase/server"

import {
  loadCompanyApplicationsPage,
  loadCompanyDashboardOverview,
  loadCompanyJobsPage,
} from "../services/company-management.service"
import type { CompanyApplicationsPage, CompanyDashboardOverview, CompanyJobsPage } from "../types"

export async function loadCompanyDashboard(
  companyUserId: number,
): Promise<CompanyDashboardOverview> {
  const supabase = await createClient()
  return loadCompanyDashboardOverview(supabase, companyUserId)
}

export async function loadManagedCompanyJobs(companyUserId: number): Promise<CompanyJobsPage> {
  const supabase = await createClient()
  return loadCompanyJobsPage(supabase, companyUserId, { limit: 100 })
}

export async function loadManagedCompanyApplications(
  companyUserId: number,
  options?: { jobId?: number | null },
): Promise<CompanyApplicationsPage> {
  const supabase = await createClient()
  return loadCompanyApplicationsPage(supabase, companyUserId, {
    jobId: options?.jobId ?? null,
    limit: 100,
  })
}
