import "server-only"

import type { createClient } from "@/lib/supabase/server"

import { getCompanyPublicOverviewRpc } from "../data/companies.repo"
import type { CompanyPublicOverview } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

const DEFAULT_JOBS_LIMIT = 8

export async function getCompanyPublicOverview(
  supabase: Supabase,
  companyUserId: number,
  options?: { jobsLimit?: number },
): Promise<CompanyPublicOverview | null> {
  if (!Number.isInteger(companyUserId) || companyUserId <= 0) return null

  const { data, error } = await getCompanyPublicOverviewRpc(
    supabase,
    companyUserId,
    options?.jobsLimit ?? DEFAULT_JOBS_LIMIT,
  )

  if (error) {
    console.error(
      "[getCompanyPublicOverview] RPC error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    )
    return null
  }

  if (!data) return null
  return data as unknown as CompanyPublicOverview
}
