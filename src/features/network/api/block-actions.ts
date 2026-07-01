"use server"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { writeAuditLog } from "@/lib/audit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { createTargetUserIdSchema } from "../schemas"
import {
  blockUser,
  getBlockStatusForUser,
  listBlockedUsersForUser,
  unblockUser,
} from "../services/connections.service"
import type { BlockStatus, BlockedUserItem } from "../types"
import { revalidateAfterConnectionChange } from "./revalidation"

export async function getBlockStatusAction(
  targetUserId: number,
): Promise<BlockStatus> {
  const current = await getCurrentUser()
  const supabase = await createClient()
  return getBlockStatusForUser(supabase, current, targetUserId)
}

export async function listBlockedUsersAction(): Promise<BlockedUserItem[]> {
  const current = await requireCurrentUser()
  return listBlockedUsersForUser(current)
}

export async function blockUserAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await blockUser(supabase, current, target)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "network.block",
      entityType: "user_blocks",
      entityId: target,
    })
    revalidateAfterConnectionChange()
  })
}

export async function unblockUserAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await unblockUser(supabase, current, target)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "network.unblock",
      entityType: "user_blocks",
      entityId: target,
    })
    revalidateAfterConnectionChange()
  })
}
