"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
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
import type { ConnectionRelation, NetworkOverview } from "../types"
import {
  deleteConnection,
  findConnectionBetween,
  getConnectTarget,
  getConnectionById,
  insertConnection,
  reactivateRejectedConnection,
  updateConnectionStatus,
} from "../data/connections.repo"
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
