import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { PostType, PostVisibility } from "@/types/database"

import type { ListPostsParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AdminPostRecord = {
  id: number
  author_id: number
  content: string
  post_type: PostType
  visibility: PostVisibility
  status: string
  created_at: string
  reaction_count: number
  comment_count: number
}

export type UserRoleRecord = {
  id: number
  role: string
}

export type MemberAuthorRecord = {
  user_id: number
  full_name: string | null
  avatar_url: string | null
}

export type CompanyAuthorRecord = {
  user_id: number
  name: string
  logo_url: string | null
}

export type AdminPostTargetRecord = {
  id: number
  status: string
  content: string
  author_id: number
}

export async function listAdminPostRows(
  supabase: AdminSupabase,
  params: ListPostsParams,
) {
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("posts")
    .select(
      "id, author_id, content, post_type, visibility, status, created_at, reaction_count, comment_count",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.type && params.type !== "all") {
    query = query.eq("post_type", params.type as never)
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as never)
  }
  if (params.search?.trim()) {
    query = query.ilike("content", `%${params.search.trim()}%`)
  }

  const { data, error } = await query
  return { rows: (data ?? []) as AdminPostRecord[], error }
}

export async function listPostAuthorRows(
  supabase: AdminSupabase,
  authorIds: number[],
) {
  if (authorIds.length === 0) {
    return { roles: [], members: [], companies: [] }
  }

  const [{ data: roles }, { data: members }, { data: companies }] =
    await Promise.all([
      supabase.from("users").select("id, role:account_type").in("id", authorIds),
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

  return {
    roles: (roles ?? []) as UserRoleRecord[],
    members: (members ?? []) as MemberAuthorRecord[],
    companies: (companies ?? []) as CompanyAuthorRecord[],
  }
}

export function getAdminPostTarget(supabase: AdminSupabase, postId: number) {
  return supabase
    .from("posts")
    .select("id, status, content, author_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<AdminPostTargetRecord>()
}

export function updateAdminPost(
  supabase: AdminSupabase,
  postId: number,
  patch: Record<string, string>,
) {
  return supabase.from("posts").update(patch as never).eq("id", postId)
}
