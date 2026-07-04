import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { writeAuditLog } from "@/lib/audit"
import { rpcResult } from "@/lib/action/rpc"
import type { createClient } from "@/lib/supabase/server"

import { resubmitCompanyVerificationRpc } from "../data/companies.repo"
import type { ResubmitVerificationResult } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function resubmitCompanyVerification(
  supabase: Supabase,
  current: CurrentUser,
): Promise<ResubmitVerificationResult> {
  const result = await rpcResult<{ status: "pending" }>(
    resubmitCompanyVerificationRpc(supabase),
  )

  if (!result.ok) return result

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "company.verification_resubmit",
    entityType: "company_profiles",
    entityId: current.appUser.id,
    newData: { status: "pending" },
  })

  return result
}
