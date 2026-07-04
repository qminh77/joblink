import "server-only"

import type { createClient } from "@/lib/supabase/server"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type HeaderPersonRow = {
  user_id: number
  full_name: string | null
  avatar_url: string | null
  headline: string | null
}

export type HeaderCompanyRow = {
  user_id: number
  name: string | null
  logo_url: string | null
  industry: string | null
}

export type SearchPagePersonRow = HeaderPersonRow & {
  profile_visibility: string
}

export type SearchUserRoleRow = {
  id: number
  role: string
}

export type SearchConnectionRow = {
  requester_id: number
  receiver_id: number
  status: string
}

export type SearchPageCompanyRow = HeaderCompanyRow & {
  verification_status: string | null
}

export type SearchPostRow = {
  id: number
  author_id: number
  content: string
  post_type: string
  created_at: string
  reaction_count: number | null
  comment_count: number | null
}

export type SearchIdentityMemberRow = {
  user_id: number
  full_name: string | null
  avatar_url: string | null
}

export type SearchIdentityCompanyRow = {
  user_id: number
  name: string | null
  logo_url: string | null
}

function likeOf(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
}

export async function listHeaderPeopleRows(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<HeaderPersonRow[]> {
  const { data } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline")
    .ilike("full_name", likeOf(q))
    .neq("profile_visibility", "private")
    .is("deleted_at", null)
    .limit(limit)

  return (data ?? []) as HeaderPersonRow[]
}

export async function listHeaderCompanyRows(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<HeaderCompanyRow[]> {
  const { data } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url, industry")
    .ilike("name", likeOf(q))
    .is("deleted_at", null)
    .limit(limit)

  return (data ?? []) as HeaderCompanyRow[]
}

export async function listSearchPagePersonRows(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<{ rows: SearchPagePersonRow[]; total: number }> {
  const { data, count } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline, profile_visibility", {
      count: "exact",
    })
    .ilike("full_name", likeOf(q))
    .neq("profile_visibility", "private")
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .range(offset, offset + limit - 1)

  return {
    rows: (data ?? []) as SearchPagePersonRow[],
    total: count ?? 0,
  }
}

export async function listUserRoleRows(
  supabase: Supabase,
  userIds: number[],
): Promise<SearchUserRoleRow[]> {
  if (userIds.length === 0) return []

  const { data } = await supabase
    .from("users")
    .select("id, role")
    .in("id", userIds)

  return (data ?? []) as SearchUserRoleRow[]
}

export async function listViewerConnectionRows(
  supabase: Supabase,
  currentUserId: number,
  userIds: number[],
): Promise<SearchConnectionRow[]> {
  if (userIds.length === 0) return []

  const ids = userIds.join(",")
  const { data } = await supabase
    .from("connections")
    .select("requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${currentUserId},receiver_id.in.(${ids})),` +
        `and(receiver_id.eq.${currentUserId},requester_id.in.(${ids}))`,
    )

  return (data ?? []) as SearchConnectionRow[]
}

export async function listSearchPageCompanyRows(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<{ rows: SearchPageCompanyRow[]; total: number }> {
  const { data, count } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url, industry, verification_status", {
      count: "exact",
    })
    .ilike("name", likeOf(q))
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

  return {
    rows: (data ?? []) as SearchPageCompanyRow[],
    total: count ?? 0,
  }
}

export async function listSearchPostRows(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<{ rows: SearchPostRow[]; total: number }> {
  const { data, count } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, post_type, created_at, reaction_count, comment_count",
      { count: "exact" },
    )
    .ilike("content", likeOf(q))
    .is("deleted_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    rows: (data ?? []) as SearchPostRow[],
    total: count ?? 0,
  }
}

export async function listMemberIdentityRows(
  supabase: Supabase,
  userIds: number[],
): Promise<SearchIdentityMemberRow[]> {
  if (userIds.length === 0) return []

  const { data } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url")
    .in("user_id", userIds)
    .is("deleted_at", null)

  return (data ?? []) as SearchIdentityMemberRow[]
}

export async function listCompanyIdentityRows(
  supabase: Supabase,
  userIds: number[],
): Promise<SearchIdentityCompanyRow[]> {
  if (userIds.length === 0) return []

  const { data } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url")
    .in("user_id", userIds)
    .is("deleted_at", null)

  return (data ?? []) as SearchIdentityCompanyRow[]
}
