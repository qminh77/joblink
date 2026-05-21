import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { ConnectionRow } from "@/types/database"

import type {
  ConnectionItem,
  ConnectionRelation,
  InvitationItem,
  NetworkOverview,
  NetworkUserCard,
} from "../types"

const SUGGESTION_LIMIT = 24

const EMPTY_OVERVIEW: NetworkOverview = {
  suggestions: [],
  connections: [],
  incoming: [],
  outgoing: [],
}

type OverviewRpcResponse = {
  suggestions?: NetworkUserCard[]
  connections?: ConnectionItem[]
  incoming?: InvitationItem[]
  outgoing?: InvitationItem[]
} | null

function normalize(payload: OverviewRpcResponse): NetworkOverview {
  if (!payload) return EMPTY_OVERVIEW
  return {
    suggestions: payload.suggestions ?? [],
    connections: payload.connections ?? [],
    incoming: payload.incoming ?? [],
    outgoing: payload.outgoing ?? [],
  }
}

export async function loadNetworkOverview(): Promise<NetworkOverview> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_network_overview", {
    p_suggestion_limit: SUGGESTION_LIMIT,
  })

  if (error) {
    console.error("[loadNetworkOverview] RPC error", error)
    return EMPTY_OVERVIEW
  }

  return normalize(data as unknown as OverviewRpcResponse)
}

export async function loadConnectionRelation(
  targetUserId: number,
): Promise<ConnectionRelation> {
  const current = await getCurrentUser()
  if (!current) return { kind: "none" }
  if (current.appUser.id === targetUserId) return { kind: "self" }

  const supabase = await createClient()
  const me = current.appUser.id

  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${me},receiver_id.eq.${targetUserId}),` +
        `and(requester_id.eq.${targetUserId},receiver_id.eq.${me})`,
    )
    .limit(1)
    .maybeSingle<
      Pick<ConnectionRow, "id" | "requester_id" | "receiver_id" | "status">
    >()

  if (!data) return { kind: "none" }

  if (data.status === "accepted") {
    return { kind: "accepted", connectionId: data.id }
  }
  if (data.status === "rejected") {
    return { kind: "rejected", connectionId: data.id }
  }
  if (data.status === "blocked") {
    return { kind: "blocked", connectionId: data.id }
  }
  return data.requester_id === me
    ? { kind: "pending_outgoing", connectionId: data.id }
    : { kind: "pending_incoming", connectionId: data.id }
}
