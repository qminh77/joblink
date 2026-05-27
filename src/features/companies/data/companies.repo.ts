import "server-only"

import type { createClient } from "@/lib/supabase/server"

// Read phụ trợ cho companies (RLS client). Nghiệp vụ follow/đổi-status đẩy vào
// RPC SECURITY DEFINER — action gọi qua `rpcResult`, không lặp ở đây.

type Supabase = Awaited<ReturnType<typeof createClient>>

export function getApplicationApplicantForNotify(
  supabase: Supabase,
  applicationId: number,
) {
  return supabase
    .from("job_applications")
    .select("applicant_id, job_id, jobs!inner(title)")
    .eq("id", applicationId)
    .maybeSingle<{
      applicant_id: number
      job_id: number
      jobs: { title: string } | null
    }>()
}
