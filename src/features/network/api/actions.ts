"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser, requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import {
  ActionError,
  action,
  assertOk,
  parse,
  unwrap,
} from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"

import { createConnectionIdSchema, createTargetUserIdSchema } from "../schemas"
import type {
  BlockStatus,
  BlockedUserItem,
  ConnectionRelation,
  NetworkOverview,
} from "../types"
import {
  deleteConnection,
  findConnectionBetween,
  getConnectTarget,
  getConnectionById,
  insertConnection,
  reactivateRejectedConnection,
  updateConnectionStatus,
} from "../data/connections.repo"
import { deleteBlock, findMyBlock, insertBlock } from "../data/blocks.repo"
import {
  isBlockedEitherDirection,
  listBlockedUsers,
} from "../data/blocks.privileged"
import {
  clearConnectionRequestNotifications,
  notifyConnectionAccepted,
  notifyConnectionRequest,
} from "../services/connection-notifications"
import { loadConnectionRelation, loadNetworkOverview } from "./queries"

// Revalidate profile layout (connect button render server-side ở đó).
// /network không cần revalidate vì client dùng React Query + realtime.
function revalidateAfterConnectionChange() {
  revalidatePath("/profile", "layout")
}

// ── Reads ───────────────────────────────────────────────────────────────────

export async function getNetworkOverviewAction(): Promise<NetworkOverview> {
  return loadNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: number,
): Promise<ConnectionRelation> {
  return loadConnectionRelation(targetUserId)
}

// ── Writes ───────────────────────────────────────────────────────────────────

export async function sendConnectionRequestAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const me = current.appUser.id
    if (me === target) throw ActionError.key("selfConnect")

    const supabase = await createClient()

    const { data: targetUser } = await getConnectTarget(supabase, target)
    if (!targetUser) throw ActionError.key("userNotFound")
    if (targetUser.status !== "active") throw ActionError.key("targetInactive")
    if (targetUser.role === "admin") throw ActionError.key("targetIsAdmin")

    // Đã chặn (bất kỳ chiều nào) thì không cho gửi lời mời. Thông điệp giữ chung
    // chung để không tiết lộ ai đang chặn ai.
    if (await isBlockedEitherDirection(me, target)) throw ActionError.key("blocked")

    const { data: existing } = await findConnectionBetween(supabase, me, target)
    if (existing) {
      if (existing.status === "accepted") throw ActionError.key("alreadyConnected")
      if (existing.status === "pending") throw ActionError.key("alreadyPending")
      if (existing.status === "blocked") throw ActionError.key("blocked")
      // rejected → tái kích hoạt thành lời mời mới (đảo chiều requester).
      assertOk(
        await reactivateRejectedConnection(supabase, existing.id, me, target),
        "unexpected",
      )
      await notifyConnectionRequest({
        receiverId: target,
        connectionId: existing.id,
        current,
      })
      revalidateAfterConnectionChange()
      return
    }

    const inserted = unwrap(
      await insertConnection(supabase, me, target),
      "unexpected",
    )
    await notifyConnectionRequest({
      receiverId: target,
      connectionId: inserted.id,
      current,
    })
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

    const { data: row } = await getConnectionById(supabase, id)
    if (!row) throw ActionError.key("invitationNotFound")
    if (row.requester_id !== current.appUser.id) {
      throw ActionError.key("noCancelPermission")
    }
    if (row.status !== "pending") throw ActionError.key("notPending")

    assertOk(await deleteConnection(supabase, row.id), "unexpected")
    await clearConnectionRequestNotifications(row.id)
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

    const { data: row } = await getConnectionById(supabase, id)
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
    revalidateAfterConnectionChange()
  })
}

export async function removeConnectionAction(
  connectionId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const id = parse(createConnectionIdSchema(t), connectionId)
    const current = await requireCurrentUser()
    const me = current.appUser.id
    const supabase = await createClient()

    const { data: row } = await getConnectionById(supabase, id)
    if (!row) throw ActionError.key("connectionNotFound")
    if (row.requester_id !== me && row.receiver_id !== me) {
      throw ActionError.key("noRemovePermission")
    }
    if (row.status !== "accepted") throw ActionError.key("notAccepted")

    assertOk(await deleteConnection(supabase, row.id), "unexpected")
    revalidateAfterConnectionChange()
  })
}

// ── Blocks (UC-46 / UC-47) ───────────────────────────────────────────────────

export async function getBlockStatusAction(
  targetUserId: number,
): Promise<BlockStatus> {
  const current = await getCurrentUser()
  if (!current || current.appUser.id === targetUserId) {
    return { blockedByMe: false }
  }
  const supabase = await createClient()
  const { data } = await findMyBlock(supabase, current.appUser.id, targetUserId)
  return { blockedByMe: data != null }
}

export async function listBlockedUsersAction(): Promise<BlockedUserItem[]> {
  const current = await requireCurrentUser()
  return listBlockedUsers(current.appUser.id)
}

export async function blockUserAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const me = current.appUser.id
    if (me === target) throw ActionError.key("selfBlock")

    const supabase = await createClient()

    const { data: targetUser } = await getConnectTarget(supabase, target)
    if (!targetUser) throw ActionError.key("userNotFound")
    if (targetUser.role === "admin") throw ActionError.key("cannotBlockAdmin")

    const { data: existing } = await findMyBlock(supabase, me, target)
    if (existing) throw ActionError.key("alreadyBlocked")

    unwrap(await insertBlock(supabase, me, target), "unexpected")

    // Chặn cắt mọi quan hệ kết nối hiện có (2 chiều) để hai bên không còn là kết
    // nối — nhắn tin đã bị RPC chặn dựa trên user_blocks.
    const { data: connection } = await findConnectionBetween(supabase, me, target)
    if (connection) {
      assertOk(await deleteConnection(supabase, connection.id), "unexpected")
    }

    revalidateAfterConnectionChange()
  })
}

export async function unblockUserAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("network.errors", async (t) => {
    const target = parse(createTargetUserIdSchema(t), targetUserId)
    const current = await requireCurrentUser()
    const me = current.appUser.id

    const supabase = await createClient()

    const { data: existing } = await findMyBlock(supabase, me, target)
    if (!existing) throw ActionError.key("notBlocked")

    assertOk(await deleteBlock(supabase, me, target), "unexpected")
    revalidateAfterConnectionChange()
  })
}
