"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser, requireCurrentUser } from "@/features/auth/api/auth-server"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
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
import type {
  BlockStatus,
  BlockedUserItem,
  ConnectionRelation,
  NetworkOverview,
} from "../types"
import { loadConnectionRelation, loadNetworkOverview } from "./queries"

function revalidateAfterConnectionChange() {
  revalidatePath("/profile", "layout")
}

export async function getNetworkOverviewAction(): Promise<NetworkOverview> {
  return loadNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: number,
): Promise<ConnectionRelation> {
  return loadConnectionRelation(targetUserId)
}

export async function sendConnectionRequestAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await sendConnectionRequest(supabase, current, target)
    revalidateAfterConnectionChange()
  })
}

export async function cancelConnectionRequestAction(
  connectionId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await cancelConnectionRequest(supabase, current, id)
    revalidateAfterConnectionChange()
  })
}

export async function respondConnectionRequestAction(
  connectionId: number,
  accept: boolean,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await respondConnectionRequest(supabase, current, id, accept)
    revalidateAfterConnectionChange()
  })
}

export async function removeConnectionAction(
  connectionId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await removeConnection(supabase, current, id)
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
    revalidateAfterConnectionChange()
  })
}
