import "server-only"

// SRS UC Trace - M03 UC-24 Xem trang cong ty.
// Flow: /company/[id] -> company public query -> company repo/RPC -> public profile + posts + active jobs.

import { createClient } from "@/lib/supabase/server"

import { getCompanyPublicOverview } from "../services/company-public.service"
import type { CompanyPublicOverview } from "../types"

export async function loadCompanyPublicOverview(
  companyUserId: number,
  options?: { jobsLimit?: number },
): Promise<CompanyPublicOverview | null> {
  const supabase = await createClient()
  return getCompanyPublicOverview(supabase, companyUserId, options)
}
