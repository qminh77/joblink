"use server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createConnectionIdSchema, createTargetUserIdSchema } from "../schemas"
import {
  cancelConnectionRequest,
  removeConnection,
  respondConnectionRequest,
  sendConnectionRequest,
} from "../services/connections.service"
import { revalidateAfterConnectionChange } from "./revalidation"

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
