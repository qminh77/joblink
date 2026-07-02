import "server-only"

import type { createClient } from "@/lib/supabase/server"

import type {
  SearchCompany,
  SearchPageCompany,
  SearchPagePerson,
  SearchPagePost,
  SearchPerson,
} from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

function likeOf(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
}

export async function searchPeople(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchPerson[]> {
  const { data } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline")
    .ilike("full_name", likeOf(q))
    .neq("profile_visibility", "private")
    .is("deleted_at", null)
    .limit(limit)
  return (data ?? [])
    .filter((m) => m.full_name)
    .map((m) => ({
      userId: m.user_id,
      name: m.full_name,
      avatarUrl: m.avatar_url,
      headline: m.headline,
    }))
}

export async function searchCompanies(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchCompany[]> {
  const { data } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url, industry")
    .ilike("name", likeOf(q))
    .is("deleted_at", null)
    .limit(limit)
  return (data ?? [])
    .filter((c) => c.name)
    .map((c) => ({
      userId: c.user_id,
      name: c.name,
      logoUrl: c.logo_url,
      industry: c.industry,
    }))
}

export async function searchPagePeople(
  supabase: Supabase,
  q: string,
  currentUserId: number,
  limit: number,
  offset: number,
): Promise<{ items: SearchPagePerson[]; total: number }> {
  const like = likeOf(q)

  const { data, count: total } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline, profile_visibility", {
      count: "exact",
    })
    .ilike("full_name", like)
    .neq("profile_visibility", "private")
    .is("deleted_at", null)
    .order("full_name", { ascending: true })
    .range(offset, offset + limit - 1)

  const profiles = ((data ?? []).filter((m) => m.full_name) as {
    user_id: number
    full_name: string
    avatar_url: string | null
    headline: string | null
    profile_visibility: string
  }[])
  if (profiles.length === 0) return { items: [], total: total ?? 0 }

  const userIds = profiles.map((m) => m.user_id)

  const [userRes, connRes] = await Promise.all([
    supabase.from("users").select("id, role").in("id", userIds),
    supabase
      .from("connections")
      .select("requester_id, receiver_id, status")
      .or(
        `and(requester_id.eq.${currentUserId},receiver_id.in.(${userIds.join(",")})),` +
          `and(receiver_id.eq.${currentUserId},requester_id.in.(${userIds.join(",")}))`,
      ),
  ])

  const roleMap = new Map<number, string>()
  for (const u of userRes.data ?? []) {
    roleMap.set(u.id, u.role)
  }

  const connMap = new Map<number, "pending" | "connected">()
  for (const c of connRes.data ?? []) {
    const otherId =
      c.requester_id === currentUserId ? c.receiver_id : c.requester_id
    if (c.status === "accepted") {
      connMap.set(otherId, "connected")
    } else if (c.status === "pending") {
      if (!connMap.has(otherId)) connMap.set(otherId, "pending")
    }
  }

  const items: SearchPagePerson[] = profiles.map((m) => ({
    userId: m.user_id,
    name: m.full_name,
    avatarUrl: m.avatar_url,
    headline: m.headline,
    role: (roleMap.get(m.user_id) ?? "member") as "member" | "admin",
    location: null,
    connectionStatus: connMap.get(m.user_id) ?? "none",
  }))

  return { items, total: total ?? 0 }
}

export async function searchPageCompanies(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<{ items: SearchPageCompany[]; total: number }> {
  const like = likeOf(q)

  const { data, count: total } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url, industry, verification_status", {
      count: "exact",
    })
    .ilike("name", like)
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

  const rows = (data ?? []).filter((c) => c.name)
  return {
    items: rows.map((c) => ({
      userId: c.user_id,
      name: c.name ?? "",
      logoUrl: c.logo_url,
      industry: c.industry,
      verified: c.verification_status === "verified",
      description: null,
    })),
    total: total ?? 0,
  }
}

export async function searchPosts(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<{ items: SearchPagePost[]; total: number }> {
  const like = likeOf(q)

  const { data: postRows, count: total } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, post_type, created_at, reaction_count, comment_count",
      { count: "exact" },
    )
    .ilike("content", like)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (!postRows || postRows.length === 0) {
    return { items: [], total: total ?? 0 }
  }

  const authorIds = Array.from(new Set(postRows.map((p) => p.author_id)))

  const [userRes, memberRes, companyRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, role")
      .in("id", authorIds),
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", authorIds)
      .is("deleted_at", null),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url")
      .in("user_id", authorIds)
      .is("deleted_at", null),
  ])

  const roleMap = new Map<number, string>()
  for (const u of userRes.data ?? []) roleMap.set(u.id, u.role)

  const authorMap = new Map<
    number,
    { name: string; avatarUrl: string | null; role: string }
  >()
  for (const m of memberRes.data ?? []) {
    authorMap.set(m.user_id, {
      name: m.full_name ?? "JobLink",
      avatarUrl: m.avatar_url,
      role: roleMap.get(m.user_id) ?? "member",
    })
  }
  for (const c of companyRes.data ?? []) {
    if (!authorMap.has(c.user_id)) {
      authorMap.set(c.user_id, {
        name: c.name ?? "JobLink",
        avatarUrl: c.logo_url,
        role: roleMap.get(c.user_id) ?? "company",
      })
    }
  }

  const items: SearchPagePost[] = postRows.map((p) => {
    const author = authorMap.get(p.author_id) ?? {
      name: "JobLink",
      avatarUrl: null,
      role: "member",
    }
    return {
      id: p.id,
      authorId: p.author_id,
      content: p.content,
      postType: p.post_type,
      createdAt: p.created_at,
      authorName: author.name,
      authorAvatarUrl: author.avatarUrl,
      authorRole: author.role,
      reactionCount: p.reaction_count ?? 0,
      commentCount: p.comment_count ?? 0,
    }
  })

  return { items, total: total ?? 0 }
}
