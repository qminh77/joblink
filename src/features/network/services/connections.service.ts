import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import { deleteBlock, findMyBlock, insertBlock } from "../data/blocks.repo"
import {
  isBlockedEitherDirection,
  listBlockedUsers,
} from "../data/blocks.privileged"
import {
  deleteConnection,
  findConnectionBetween,
  getConnectTarget,
  getConnectionById,
  insertConnection,
  reactivateRejectedConnection,
  updateConnectionStatus,
} from "../data/connections.repo"
import type { BlockStatus, BlockedUserItem } from "../types"
import {
  clearConnectionRequestNotifications,
  notifyConnectionAccepted,
  notifyConnectionRequest,
} from "./connection-notifications"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function sendConnectionRequest(
  supabase: Supabase,
  current: CurrentUser,
  targetUserId: number,
) {
  const me = current.appUser.id
  if (me === targetUserId) throw ActionError.key("selfConnect")

  const { data: targetUser } = await getConnectTarget(supabase, targetUserId)
  if (!targetUser) throw ActionError.key("userNotFound")
  if (targetUser.status !== "active") throw ActionError.key("targetInactive")
  if (targetUser.role === "admin") throw ActionError.key("targetIsAdmin")

  if (await isBlockedEitherDirection(me, targetUserId)) {
    throw ActionError.key("blocked")
  }

  const { data: existing } = await findConnectionBetween(
    supabase,
    me,
    targetUserId,
  )
  if (existing) {
    if (existing.status === "accepted") {
      throw ActionError.key("alreadyConnected")
    }
    if (existing.status === "pending") throw ActionError.key("alreadyPending")
    if (existing.status === "blocked") throw ActionError.key("blocked")

    assertOk(
      await reactivateRejectedConnection(
        supabase,
        existing.id,
        me,
        targetUserId,
      ),
      "unexpected",
    )
    await notifyConnectionRequest({
      receiverId: targetUserId,
      connectionId: existing.id,
      current,
    })
    return
  }

  const inserted = unwrap(
    await insertConnection(supabase, me, targetUserId),
    "unexpected",
  )
  await notifyConnectionRequest({
    receiverId: targetUserId,
    connectionId: inserted.id,
    current,
  })
}

export async function cancelConnectionRequest(
  supabase: Supabase,
  current: CurrentUser,
  connectionId: number,
) {
  const { data: row } = await getConnectionById(supabase, connectionId)
  if (!row) throw ActionError.key("invitationNotFound")
  if (row.requester_id !== current.appUser.id) {
    throw ActionError.key("noCancelPermission")
  }
  if (row.status !== "pending") throw ActionError.key("notPending")

  assertOk(await deleteConnection(supabase, row.id), "unexpected")
  await clearConnectionRequestNotifications(row.id)
}

export async function respondConnectionRequest(
  supabase: Supabase,
  current: CurrentUser,
  connectionId: number,
  accept: boolean,
) {
  const { data: row } = await getConnectionById(supabase, connectionId)
  if (!row) throw ActionError.key("invitationNotFound")
  if (row.receiver_id !== current.appUser.id) {
    throw ActionError.key("noRespondPermission")
  }
  if (row.status !== "pending") throw ActionError.key("notPending")

  assertOk(
    await updateConnectionStatus(
      supabase,
      row.id,
      accept ? "accepted" : "rejected",
    ),
    "unexpected",
  )
  if (accept) {
    await notifyConnectionAccepted({
      requesterId: row.requester_id,
      connectionId: row.id,
      current,
    })
  }
}

export async function removeConnection(
  supabase: Supabase,
  current: CurrentUser,
  connectionId: number,
) {
  const me = current.appUser.id
  const { data: row } = await getConnectionById(supabase, connectionId)
  if (!row) throw ActionError.key("connectionNotFound")
  if (row.requester_id !== me && row.receiver_id !== me) {
    throw ActionError.key("noRemovePermission")
  }
  if (row.status !== "accepted") throw ActionError.key("notAccepted")

  assertOk(await deleteConnection(supabase, row.id), "unexpected")
}

export async function getBlockStatusForUser(
  supabase: Supabase,
  current: CurrentUser | null,
  targetUserId: number,
): Promise<BlockStatus> {
  if (!current || current.appUser.id === targetUserId) {
    return { blockedByMe: false }
  }
  const { data } = await findMyBlock(supabase, current.appUser.id, targetUserId)
  return { blockedByMe: data != null }
}

export function listBlockedUsersForUser(
  current: CurrentUser,
): Promise<BlockedUserItem[]> {
  return listBlockedUsers(current.appUser.id)
}

export async function blockUser(
  supabase: Supabase,
  current: CurrentUser,
  targetUserId: number,
) {
  const me = current.appUser.id
  if (me === targetUserId) throw ActionError.key("selfBlock")

  const { data: targetUser } = await getConnectTarget(supabase, targetUserId)
  if (!targetUser) throw ActionError.key("userNotFound")
  if (targetUser.role === "admin") throw ActionError.key("cannotBlockAdmin")

  const { data: existing } = await findMyBlock(supabase, me, targetUserId)
  if (existing) throw ActionError.key("alreadyBlocked")

  unwrap(await insertBlock(supabase, me, targetUserId), "unexpected")

  const { data: connection } = await findConnectionBetween(
    supabase,
    me,
    targetUserId,
  )
  if (connection) {
    assertOk(await deleteConnection(supabase, connection.id), "unexpected")
  }
}

export async function unblockUser(
  supabase: Supabase,
  current: CurrentUser,
  targetUserId: number,
) {
  const me = current.appUser.id
  const { data: existing } = await findMyBlock(supabase, me, targetUserId)
  if (!existing) throw ActionError.key("notBlocked")

  assertOk(await deleteBlock(supabase, me, targetUserId), "unexpected")
}
