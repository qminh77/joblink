import "server-only"

import type { createClient } from "@/lib/supabase/server"

// Reads phụ trợ cho jobs (RLS client). Phần ghi nặng (tạo job/apply/save…) nằm
// trong RPC SECURITY DEFINER ở DB — action gọi qua `rpcResult`, không lặp ở đây.

type Supabase = Awaited<ReturnType<typeof createClient>>

export function getJobOwnerForNotify(supabase: Supabase, jobId: number) {
  return supabase
    .from("jobs")
    .select("company_user_id, title")
    .eq("id", jobId)
    .maybeSingle<{ company_user_id: number; title: string }>()
}

export function getApplicationJobForNotify(
  supabase: Supabase,
  applicationId: number,
) {
  return supabase
    .from("job_applications")
    .select("job_id, jobs!inner(company_user_id, title)")
    .eq("id", applicationId)
    .maybeSingle<{
      job_id: number
      jobs: { company_user_id: number; title: string } | null
    }>()
}
