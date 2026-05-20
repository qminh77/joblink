"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { ConnectionRow } from "@/types/database"
import type { NetworkUserCard } from "../types"

import { loadSuggestions } from "./queries"

import {
  createConnectionIdSchema,
  createTargetUserIdSchema,
} from "../schemas"

type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

function revalidateNetwork() {
  revalidatePath("/network")
  revalidatePath("/profile", "layout")
}

export async function sendConnectionRequestAction(
  targetUserId: number,
): Promise<ActionResult> {
  const tv = await getTranslations("network.validation")
  const te = await getTranslations("network.errors")

  const parsed = createTargetUserIdSchema(te).safeParse(targetUserId)
  if (!parsed.success) {
    void tv
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const me = current.appUser.id
  if (me === parsed.data) return fail(te("selfConnect"))

  const supabase = await createClient()

  const { data: target } = await supabase
    .from("users")
    .select("id, status, role")
    .eq("id", parsed.data)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; status: string; role: string }>()

  if (!target) return fail(te("userNotFound"))
  if (target.status !== "active") return fail(te("targetInactive"))
  if (target.role === "admin") return fail(te("targetIsAdmin"))

  const { data: existing } = await supabase
    .from("connections")
    .select("id, status, requester_id, receiver_id")
    .or(
      `and(requester_id.eq.${me},receiver_id.eq.${parsed.data}),` +
        `and(requester_id.eq.${parsed.data},receiver_id.eq.${me})`,
    )
    .limit(1)
    .maybeSingle<
      Pick<ConnectionRow, "id" | "status" | "requester_id" | "receiver_id">
    >()

  if (existing) {
    if (existing.status === "accepted") return fail(te("alreadyConnected"))
    if (existing.status === "pending") return fail(te("alreadyPending"))
    if (existing.status === "blocked") return fail(te("blocked"))
    if (existing.status === "rejected") {
      const { error } = await supabase
        .from("connections")
        .update({
          requester_id: me,
          receiver_id: parsed.data,
          status: "pending",
          requested_at: new Date().toISOString(),
          responded_at: null,
        })
        .eq("id", existing.id)
      if (error) return fail(error.message)
      revalidateNetwork()
      return { ok: true }
    }
  }

  const { error } = await supabase.from("connections").insert({
    requester_id: me,
    receiver_id: parsed.data,
    status: "pending",
  })

  if (error) return fail(error.message)
  revalidateNetwork()
  return { ok: true }
}

export async function cancelConnectionRequestAction(
  connectionId: number,
): Promise<ActionResult> {
  const te = await getTranslations("network.errors")
  const parsed = createConnectionIdSchema(te).safeParse(connectionId)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from("connections")
    .select("id, requester_id, status")
    .eq("id", parsed.data)
    .maybeSingle<Pick<ConnectionRow, "id" | "requester_id" | "status">>()

  if (!row) return fail(te("invitationNotFound"))
  if (row.requester_id !== current.appUser.id) {
    return fail(te("noCancelPermission"))
  }
  if (row.status !== "pending") return fail(te("notPending"))

  const { error } = await supabase.from("connections").delete().eq("id", row.id)
  if (error) return fail(error.message)
  revalidateNetwork()
  return { ok: true }
}

export async function respondConnectionRequestAction(
  connectionId: number,
  accept: boolean,
): Promise<ActionResult> {
  const te = await getTranslations("network.errors")
  const parsed = createConnectionIdSchema(te).safeParse(connectionId)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data: row } = await supabase
    .from("connections")
    .select("id, receiver_id, status")
    .eq("id", parsed.data)
    .maybeSingle<Pick<ConnectionRow, "id" | "receiver_id" | "status">>()

  if (!row) return fail(te("invitationNotFound"))
  if (row.receiver_id !== current.appUser.id) {
    return fail(te("noRespondPermission"))
  }
  if (row.status !== "pending") return fail(te("notPending"))

  const { error } = await supabase
    .from("connections")
    .update({
      status: accept ? "accepted" : "rejected",
      responded_at: new Date().toISOString(),
    })
    .eq("id", row.id)

  if (error) return fail(error.message)
  revalidateNetwork()
  return { ok: true }
}

export async function removeConnectionAction(
  connectionId: number,
): Promise<ActionResult> {
  const te = await getTranslations("network.errors")
  const parsed = createConnectionIdSchema(te).safeParse(connectionId)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()
  const me = current.appUser.id

  const { data: row } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .eq("id", parsed.data)
    .maybeSingle<
      Pick<ConnectionRow, "id" | "requester_id" | "receiver_id" | "status">
    >()

  if (!row) return fail(te("connectionNotFound"))
  if (row.requester_id !== me && row.receiver_id !== me) {
    return fail(te("noRemovePermission"))
  }
  if (row.status !== "accepted") return fail(te("notAccepted"))

  const { error } = await supabase.from("connections").delete().eq("id", row.id)
  if (error) return fail(error.message)
  revalidateNetwork()
  return { ok: true }
}

export async function getSuggestionsAction(): Promise<NetworkUserCard[]> {
  return loadSuggestions()
}
