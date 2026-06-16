"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { PostType, PostVisibility } from "@/types/database"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { postActionSchema, type PostActionInput } from "../schemas"

export type AdminPostRow = {
  id: number
  content: string
  postType: PostType
  visibility: PostVisibility
  status: string
  authorId: number
  authorName: string
  authorAvatarUrl: string | null
  authorRole: string
  reactionCount: number
  commentCount: number
  createdAt: string
}

export type ListPostsParams = {
  search?: string
  type?: PostType | "all"
  status?: string
  limit?: number
}

const POST_STATUSES = ["active", "hidden", "deleted"] as const

export async function listAdminPosts(
  params: ListPostsParams = {},
): Promise<AdminPostRow[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("posts")
    .select("id, author_id, content, post_type, visibility, status, created_at")
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

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: number
    author_id: number
    content: string
    post_type: PostType
    visibility: PostVisibility
    status: string
    created_at: string
  }>

  const authorIds = [...new Set(rows.map((r) => r.author_id))]
  const postIds = rows.map((r) => r.id)

  const authorMap: Record<number, { name: string; avatarUrl: string | null; role: string }> = {}
  const reactionMap: Record<number, number> = {}
  const commentMap: Record<number, number> = {}

  if (authorIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, role")
      .in("id", authorIds)
    const userRoles: Record<number, string> = {}
    for (const u of (users ?? []) as Array<{ id: number; role: string }>) {
      userRoles[u.id] = u.role
    }

    const { data: members } = await supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", authorIds)
      .is("deleted_at", null)
    for (const m of (members ?? []) as Array<{ user_id: number; full_name: string | null; avatar_url: string | null }>) {
      authorMap[m.user_id] = {
        name: m.full_name ?? `user#${m.user_id}`,
        avatarUrl: m.avatar_url,
        role: userRoles[m.user_id] ?? "member",
      }
    }

    const { data: companies } = await supabase
      .from("company_profiles")
      .select("user_id, name, logo_url")
      .in("user_id", authorIds)
      .is("deleted_at", null)
    for (const c of (companies ?? []) as Array<{ user_id: number; name: string; logo_url: string | null }>) {
      authorMap[c.user_id] = {
        name: c.name,
        avatarUrl: c.logo_url,
        role: userRoles[c.user_id] ?? "company",
      }
    }

    for (const id of authorIds) {
      if (!authorMap[id]) {
        authorMap[id] = { name: `user#${id}`, avatarUrl: null, role: userRoles[id] ?? "member" }
      }
    }
  }

  if (postIds.length > 0) {
    const { data: reactions } = await supabase
      .from("post_reactions")
      .select("post_id")
      .in("post_id", postIds)
    for (const r of (reactions ?? []) as Array<{ post_id: number }>) {
      reactionMap[r.post_id] = (reactionMap[r.post_id] ?? 0) + 1
    }

    const { data: comments } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds)
      .is("deleted_at", null)
      .eq("status", "active")
    for (const c of (comments ?? []) as Array<{ post_id: number }>) {
      commentMap[c.post_id] = (commentMap[c.post_id] ?? 0) + 1
    }
  }

  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    postType: r.post_type,
    visibility: r.visibility,
    status: r.status,
    authorId: r.author_id,
    authorName: authorMap[r.author_id]?.name ?? `user#${r.author_id}`,
    authorAvatarUrl: authorMap[r.author_id]?.avatarUrl ?? null,
    authorRole: authorMap[r.author_id]?.role ?? "member",
    reactionCount: reactionMap[r.id] ?? 0,
    commentCount: commentMap[r.id] ?? 0,
    createdAt: r.created_at,
  }))
}

export async function applyPostAction(
  input: PostActionInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = postActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("posts")
    .select("id, status, content, author_id")
    .eq("id", parsed.data.postId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: number
      status: string
      content: string
      author_id: number
    }>()
  if (!target) return { ok: false, error: "not_found" }

  const action = parsed.data.action
  const patch: Record<string, string> = {}

  if (action === "hide") {
    patch.status = "hidden"
  } else if (action === "restore") {
    patch.status = "active"
  } else if (action === "delete") {
    patch.deleted_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from("posts")
    .update(patch as never)
    .eq("id", parsed.data.postId)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `post.${action}`,
    entityType: "posts",
    entityId: parsed.data.postId,
    oldData: { status: target.status, content: target.content.substring(0, 200) },
    newData: patch,
    reason: parsed.data.reason,
  })

  revalidatePath("/admin/posts")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}
