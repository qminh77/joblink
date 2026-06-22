"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { writeAuditLog } from "@/lib/audit"
import { rpcResult } from "@/lib/action/rpc"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createConnectionIdSchema, createTargetUserIdSchema } from "../schemas"
import {
  blockUser,
  cancelConnectionRequest,
  getBlockStatusForUser,
  listBlockedUsersForUser,
  removeConnection,
  respondConnectionRequest,
  sendConnectionRequest,
  unblockUser,
} from "../services/connections.service"
import { notifyUserFollowed } from "../services/connection-notifications"
import type {
  BlockStatus,
  BlockedUserItem,
  ConnectionRelation,
  NetworkOverview,
  ToggleFollowUserResult,
} from "../types"
import { loadConnectionRelation, loadNetworkOverview } from "./queries"

function revalidateAfterConnectionChange() {
  revalidatePath("/profile", "layout")
}

export async function getNetworkOverviewAction(): Promise<NetworkOverview> {
  await requirePermission("network.view")
  return loadNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: number,
): Promise<ConnectionRelation> {
  await requirePermission("network.view")
  return loadConnectionRelation(targetUserId)
}

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

export async function sendConnectionRequestAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requirePermission("network.connect")
    await checkRateLimit(current.appUser.id, "connection", 10, 60)
    const supabase = await createClient()

    await sendConnectionRequest(supabase, current, target)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "network.connection_send",
      entityType: "connections",
      entityId: target,
    })
    revalidateAfterConnectionChange()
  })
}

export async function cancelConnectionRequestAction(
  connectionId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requirePermission("network.connect")
    const supabase = await createClient()

    await cancelConnectionRequest(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "network.connection_cancel",
      entityType: "connections",
      entityId: id,
    })
    revalidateAfterConnectionChange()
  })
}

export async function respondConnectionRequestAction(
  connectionId: number,
  accept: boolean,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requirePermission("network.connect")
    const supabase = await createClient()

    await respondConnectionRequest(supabase, current, id, accept)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: accept ? "network.connection_accept" : "network.connection_reject",
      entityType: "connections",
      entityId: id,
    })
    revalidateAfterConnectionChange()
  })
}

export async function removeConnectionAction(
  connectionId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requirePermission("network.connect")
    const supabase = await createClient()

    await removeConnection(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "network.connection_remove",
      entityType: "connections",
      entityId: id,
    })
    revalidateAfterConnectionChange()
  })
}

export async function getBlockStatusAction(
  targetUserId: number,
): Promise<BlockStatus> {
  const current = await getCurrentUser()
  const supabase = await createClient()
  return getBlockStatusForUser(supabase, current, targetUserId)
}

export async function listBlockedUsersAction(): Promise<BlockedUserItem[]> {
  const current = await requirePermission("network.block")
  return listBlockedUsersForUser(current)
}

export async function blockUserAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requirePermission("network.block")
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
    const current = await requirePermission("network.block")
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
