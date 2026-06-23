import "server-only"

import { createClient } from "@/lib/supabase/server"

import type { CompanyPublicOverview } from "../types"

const DEFAULT_JOBS_LIMIT = 8

export async function loadCompanyPublicOverview(
  companyUserId: number,
  options?: { jobsLimit?: number },
): Promise<CompanyPublicOverview | null> {
  if (!Number.isInteger(companyUserId) || companyUserId <= 0) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_company_public_overview", {
    p_company_user_id: companyUserId,
    p_jobs_limit: options?.jobsLimit ?? DEFAULT_JOBS_LIMIT,
  })

  if (error) {
    console.error(
      "[loadCompanyPublicOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }

  if (!data) return null
  return data as unknown as CompanyPublicOverview
}
