import "server-only"

import { getTranslations } from "next-intl/server"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/constants"
import type { ConnectionRow } from "@/types/database"

import type {
  ConnectionItem,
  ConnectionRelation,
  InvitationItem,
  NetworkUserCard,
} from "../types"

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

const SUGGESTION_LIMIT = 24

type Defaults = { member: string; company: string }

async function loadDefaults(): Promise<Defaults> {
  const tv = await getTranslations("profile.view")
  return { member: tv("memberDefault"), company: tv("companyDefault") }
}

type MemberProfileLite = {
  user_id: number
  full_name: string
  avatar_url: string | null
  headline: string | null
  provinces: { name: string } | null
  districts: { name: string } | null
}

type CompanyProfileLite = {
  user_id: number
  name: string
  logo_url: string | null
  industry: string | null
  provinces: { name: string } | null
  districts: { name: string } | null
}

const MEMBER_PROFILE_SELECT =
  "user_id, full_name, avatar_url, headline, provinces(name), districts(name)"

const COMPANY_PROFILE_SELECT =
  "user_id, name, logo_url, industry, provinces(name), districts(name)"

function buildLocation(
  province: { name: string } | null | undefined,
  district: { name: string } | null | undefined,
): string | null {
  const parts = [district?.name, province?.name].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

function memberToCard(
  row: MemberProfileLite,
  role: UserRole,
  fallback: string,
): NetworkUserCard {
  return {
    userId: row.user_id,
    role,
    displayName: row.full_name || fallback,
    avatarUrl: row.avatar_url,
    headline: row.headline,
    location: buildLocation(row.provinces, row.districts),
  }
}

function companyToCard(
  row: CompanyProfileLite,
  role: UserRole,
  fallback: string,
): NetworkUserCard {
  return {
    userId: row.user_id,
    role,
    displayName: row.name || fallback,
    avatarUrl: row.logo_url,
    headline: row.industry,
    location: buildLocation(row.provinces, row.districts),
  }
}

async function fetchUserCards(
  supabase: SupabaseServer,
  userIds: number[],
  defaults: Defaults,
): Promise<Map<number, NetworkUserCard>> {
  const cards = new Map<number, NetworkUserCard>()
  if (userIds.length === 0) return cards

  const { data: roleRows } = await supabase
    .from("users")
    .select("id, role")
    .in("id", userIds)
    .is("deleted_at", null)

  const roles = new Map<number, UserRole>()
  for (const row of (roleRows ?? []) as Array<{ id: number; role: UserRole }>) {
    roles.set(row.id, row.role)
  }

  const memberIds: number[] = []
  const companyIds: number[] = []
  for (const [id, role] of roles) {
    if (role === "company") companyIds.push(id)
    else if (role === "member") memberIds.push(id)
  }

  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("member_profiles")
      .select(MEMBER_PROFILE_SELECT)
      .in("user_id", memberIds)
      .is("deleted_at", null)
    for (const row of (data ?? []) as unknown as MemberProfileLite[]) {
      cards.set(row.user_id, memberToCard(row, "member", defaults.member))
    }
  }

  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("company_profiles")
      .select(COMPANY_PROFILE_SELECT)
      .in("user_id", companyIds)
      .is("deleted_at", null)
    for (const row of (data ?? []) as unknown as CompanyProfileLite[]) {
      cards.set(row.user_id, companyToCard(row, "company", defaults.company))
    }
  }

  return cards
}

async function loadRelatedUserIds(
  supabase: SupabaseServer,
  currentUserId: number,
): Promise<number[]> {
  const { data } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

  const ids = new Set<number>()
  for (const row of (data ?? []) as Pick<
    ConnectionRow,
    "requester_id" | "receiver_id"
  >[]) {
    ids.add(
      row.requester_id === currentUserId ? row.receiver_id : row.requester_id,
    )
  }
  return Array.from(ids)
}

export async function loadConnections(): Promise<ConnectionItem[]> {
  const current = await getCurrentUser()
  if (!current) return []

  const supabase = await createClient()
  const defaults = await loadDefaults()
  const me = current.appUser.id

  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, responded_at, requested_at")
    .or(`requester_id.eq.${me},receiver_id.eq.${me}`)
    .eq("status", "accepted")
    .order("responded_at", { ascending: false, nullsFirst: false })

  const rows = (data ?? []) as Pick<
    ConnectionRow,
    "id" | "requester_id" | "receiver_id" | "responded_at" | "requested_at"
  >[]

  const otherIds = rows.map((row) =>
    row.requester_id === me ? row.receiver_id : row.requester_id,
  )
  const cards = await fetchUserCards(supabase, otherIds, defaults)

  return rows
    .map((row): ConnectionItem | null => {
      const otherId = row.requester_id === me ? row.receiver_id : row.requester_id
      const card = cards.get(otherId)
      if (!card) return null
      return {
        ...card,
        connectionId: row.id,
        connectedAt: row.responded_at ?? row.requested_at,
      }
    })
    .filter((item): item is ConnectionItem => item != null)
}

export async function loadInvitations(): Promise<{
  incoming: InvitationItem[]
  outgoing: InvitationItem[]
}> {
  const current = await getCurrentUser()
  if (!current) return { incoming: [], outgoing: [] }

  const supabase = await createClient()
  const defaults = await loadDefaults()
  const me = current.appUser.id

  const { data } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, requested_at")
    .or(`requester_id.eq.${me},receiver_id.eq.${me}`)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })

  const rows = (data ?? []) as Pick<
    ConnectionRow,
    "id" | "requester_id" | "receiver_id" | "requested_at"
  >[]

  const otherIds = rows.map((row) =>
    row.requester_id === me ? row.receiver_id : row.requester_id,
  )
  const cards = await fetchUserCards(supabase, otherIds, defaults)

  const incoming: InvitationItem[] = []
  const outgoing: InvitationItem[] = []

  for (const row of rows) {
    const isIncoming = row.receiver_id === me
    const otherId = isIncoming ? row.requester_id : row.receiver_id
    const card = cards.get(otherId)
    if (!card) continue

    const item: InvitationItem = {
      ...card,
      connectionId: row.id,
      requestedAt: row.requested_at,
      direction: isIncoming ? "incoming" : "outgoing",
    }
    if (isIncoming) incoming.push(item)
    else outgoing.push(item)
  }

  return { incoming, outgoing }
}

export async function loadSuggestions(
  searchQuery?: string,
): Promise<NetworkUserCard[]> {
  const current = await getCurrentUser()
  if (!current) return []

  const supabase = await createClient()
  const defaults = await loadDefaults()
  const me = current.appUser.id
  const excluded = new Set(await loadRelatedUserIds(supabase, me))
  excluded.add(me)

  const keyword = searchQuery?.trim()
  const candidateIds = await collectCandidateIds(supabase, keyword, excluded)
  if (candidateIds.length === 0) return []

  const cards = await fetchUserCards(supabase, candidateIds, defaults)
  return candidateIds
    .map((id) => cards.get(id))
    .filter((card): card is NetworkUserCard => card != null)
}

async function collectCandidateIds(
  supabase: SupabaseServer,
  keyword: string | undefined,
  excluded: Set<number>,
): Promise<number[]> {
  if (keyword && keyword.length > 0) {
    const pattern = `%${keyword.replace(/[\\%_]/g, " ")}%`
    const [memberRes, companyRes] = await Promise.all([
      supabase
        .from("member_profiles")
        .select("user_id")
        .is("deleted_at", null)
        .or(`full_name.ilike.${pattern},headline.ilike.${pattern}`)
        .limit(SUGGESTION_LIMIT * 2),
      supabase
        .from("company_profiles")
        .select("user_id")
        .is("deleted_at", null)
        .or(`name.ilike.${pattern},industry.ilike.${pattern}`)
        .limit(SUGGESTION_LIMIT * 2),
    ])
    const ids: number[] = []
    for (const row of (memberRes.data ?? []) as Array<{ user_id: number }>) {
      if (!excluded.has(row.user_id)) ids.push(row.user_id)
    }
    for (const row of (companyRes.data ?? []) as Array<{ user_id: number }>) {
      if (!excluded.has(row.user_id)) ids.push(row.user_id)
    }
    return await filterActiveUserIds(supabase, ids, SUGGESTION_LIMIT)
  }

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("status", "active")
    .neq("role", "admin")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(SUGGESTION_LIMIT * 3)

  const ids: number[] = []
  for (const row of (data ?? []) as Array<{ id: number }>) {
    if (excluded.has(row.id)) continue
    ids.push(row.id)
    if (ids.length >= SUGGESTION_LIMIT) break
  }
  return ids
}

async function filterActiveUserIds(
  supabase: SupabaseServer,
  ids: number[],
  limit: number,
): Promise<number[]> {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from("users")
    .select("id")
    .in("id", ids)
    .eq("status", "active")
    .neq("role", "admin")
    .is("deleted_at", null)
    .limit(limit)
  return ((data ?? []) as Array<{ id: number }>).map((row) => row.id)
}

export async function loadNetworkOverview(): Promise<{
  suggestions: NetworkUserCard[]
  connections: ConnectionItem[]
  incoming: InvitationItem[]
  outgoing: InvitationItem[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_network_overview", {
    p_suggestion_limit: SUGGESTION_LIMIT,
  })

  if (error || !data) {
    console.error("[loadNetworkOverview] RPC error", error)
    return {
      suggestions: [],
      connections: [],
      incoming: [],
      outgoing: [],
    }
  }

  const payload = data as unknown as {
    suggestions?: NetworkUserCard[]
    connections?: ConnectionItem[]
    incoming?: InvitationItem[]
    outgoing?: InvitationItem[]
  }

  return {
    suggestions: payload.suggestions ?? [],
    connections: payload.connections ?? [],
    incoming: payload.incoming ?? [],
    outgoing: payload.outgoing ?? [],
  }
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
