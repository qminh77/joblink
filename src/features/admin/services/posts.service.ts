import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

import { writeAuditLog } from "./audit-log.service"
import type { PostActionInput } from "../schemas"
import {
  getAdminPostTarget,
  listAdminPostRows,
  listPostAuthorRows,
  updateAdminPost,
} from "../data/posts.repo"
import type { AdminActionResult, AdminPostRow, ListPostsParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

type AdminActor = {
  appUser: { id: number }
}

type PostAuthor = {
  name: string
  avatarUrl: string | null
  role: string
}

export async function loadAdminPosts(
  supabase: AdminSupabase,
  params: ListPostsParams = {},
): Promise<AdminPostRow[]> {
  const { rows, error } = await listAdminPostRows(supabase, params)
  if (error) return []

  const authorMap = await buildPostAuthors(
    supabase,
    rows.map((row) => row.author_id),
  )

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    postType: row.post_type,
    visibility: row.visibility,
    status: row.status,
    authorId: row.author_id,
    authorName: authorMap[row.author_id]?.name ?? `user#${row.author_id}`,
    authorAvatarUrl: authorMap[row.author_id]?.avatarUrl ?? null,
    authorRole: authorMap[row.author_id]?.role ?? "member",
    reactionCount: row.reaction_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
  }))
}

export async function applyPostModerationAction(
  supabase: AdminSupabase,
  actor: AdminActor,
  input: PostActionInput,
): Promise<AdminActionResult> {
  const { data: target } = await getAdminPostTarget(supabase, input.postId)
  if (!target) return { ok: false, error: "not_found" }

  const patch = postActionPatch(input.action)
  const { error } = await updateAdminPost(supabase, input.postId, patch)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `post.${input.action}`,
    entityType: "posts",
    entityId: input.postId,
    oldData: {
      status: target.status,
      content: target.content.substring(0, 200),
    },
    newData: patch,
    reason: input.reason,
  })

  return { ok: true }
}

async function buildPostAuthors(
  supabase: AdminSupabase,
  authorIds: number[],
) {
  const authors: Record<number, PostAuthor> = {}
  const ids = [...new Set(authorIds)]
  const { roles, members, companies } = await listPostAuthorRows(supabase, ids)

  const userRoles: Record<number, string> = {}
  for (const role of roles) {
    userRoles[role.id] = role.role
  }

  for (const member of members) {
    authors[member.user_id] = {
      name: member.full_name ?? `user#${member.user_id}`,
      avatarUrl: member.avatar_url,
      role: userRoles[member.user_id] ?? "member",
    }
  }

  for (const company of companies) {
    authors[company.user_id] = {
      name: company.name,
      avatarUrl: company.logo_url,
      role: userRoles[company.user_id] ?? "company",
    }
  }

  for (const id of ids) {
    if (!authors[id]) {
      authors[id] = {
        name: `user#${id}`,
        avatarUrl: null,
        role: userRoles[id] ?? "member",
      }
    }
  }

  return authors
}

function postActionPatch(action: PostActionInput["action"]): Record<string, string> {
  if (action === "hide") return { status: "hidden" }
  if (action === "restore") return { status: "active" }
  return { deleted_at: new Date().toISOString() }
}
