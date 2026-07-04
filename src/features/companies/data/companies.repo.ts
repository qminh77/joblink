import "server-only"

import type { createClient } from "@/lib/supabase/server"

type Supabase = Awaited<ReturnType<typeof createClient>>

export function getCompanyPublicOverviewRpc(
  supabase: Supabase,
  companyUserId: number,
  jobsLimit: number,
) {
  return supabase.rpc("get_company_public_overview", {
    p_company_user_id: companyUserId,
    p_jobs_limit: jobsLimit,
  })
}

export function toggleCompanyFollowRpc(
  supabase: Supabase,
  companyUserId: number,
) {
  return supabase.rpc("toggle_follow_company", {
    p_company_user_id: companyUserId,
  })
}

export function resubmitCompanyVerificationRpc(supabase: Supabase) {
  return supabase.rpc("resubmit_company_verification")
}
