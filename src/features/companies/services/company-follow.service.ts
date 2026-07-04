import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { writeAuditLog } from "@/lib/audit"
import { rpcResult } from "@/lib/action/rpc"
import type { createClient } from "@/lib/supabase/server"

import { toggleCompanyFollowRpc } from "../data/companies.repo"
import type { ToggleFollowResult } from "../types"
import { notifyCompanyFollowed } from "./company-notifications"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function toggleCompanyFollow(
  supabase: Supabase,
  current: CurrentUser,
  companyUserId: number,
): Promise<ToggleFollowResult> {
  const result = await rpcResult<{ isFollowing: boolean; followerCount: number }>(
    toggleCompanyFollowRpc(supabase, companyUserId),
  )

  if (!result.ok) return result

  if (result.isFollowing) {
    await notifyCompanyFollowed({ companyUserId, current })
  }
  await writeAuditLog({
    actorId: current.appUser.id,
    action: result.isFollowing ? "company.follow" : "company.unfollow",
    entityType: "follows",
    entityId: companyUserId,
  })

  return result
}
