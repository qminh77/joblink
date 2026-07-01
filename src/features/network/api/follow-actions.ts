"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { rpcResult } from "@/lib/action/rpc"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createTargetUserIdSchema } from "../schemas"
import { notifyUserFollowed } from "../services/connection-notifications"
import type { ToggleFollowUserResult } from "../types"
import { revalidateAfterConnectionChange } from "./revalidation"

export async function toggleFollowUserAction(
  targetUserId: number,
): Promise<ToggleFollowUserResult> {
  const te = await getTranslations("network.errors")
  const parsed = createTargetUserIdSchema(te).safeParse(targetUserId)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? te("unexpected"),
    }
  }

  const current = await requirePermission("network.follow")
  await checkRateLimit(current.appUser.id, "connection", 10, 60) // 10 connections / 60s
  const supabase = await createClient()

  const result = await rpcResult<{
    isFollowing: boolean
    followerCount: number
  }>(
    supabase.rpc("toggle_follow_user", {
      p_target_user_id: parsed.data,
    }),
  )

  if (result.ok) {
    revalidateAfterConnectionChange()
    revalidatePath(`/profile/${parsed.data}`)
    if (result.isFollowing) {
      await notifyUserFollowed({
        targetUserId: parsed.data,
        current,
      })
    }
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.isFollowing ? "network.follow" : "network.unfollow",
      entityType: "follows",
      entityId: parsed.data,
    })
  }
  return result
}
