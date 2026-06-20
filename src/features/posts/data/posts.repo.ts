import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type {
  Json,
  PollOptionRow,
  PostReactionType,
  PostType,
  PostVisibility,
} from "@/types/database"

import type { MentionableUser, PollOption } from "../types"

// Lớp data-access của posts: nơi DUY NHẤT biết tên bảng/cột + câu select.
// Mọi hàm chạy bằng client RLS (anon key + JWT của user) → RLS là hàng rào
// thật, các điều kiện `.eq(author_id, me)` là phòng thủ chiều sâu.
// KHÔNG auth, KHÔNG i18n, KHÔNG side-effect ở đây — action lo những việc đó.

type Supabase = Awaited<ReturnType<typeof createClient>>

export type InsertedPostRow = {
  id: number
  author_id: number
  content: string
  post_type: PostType
  media: Json | null
  visibility: PostVisibility
  created_at: string
}

type CreatePostRpcPayload =
  | { ok: true; post: InsertedPostRow }
  | { ok: false; error: string }

function rpcError(message: string) {
  return { message }
}

export async function insertPost(
  supabase: Supabase,
  values: {
    authorId: number
    content: string
    postType: PostType
    media: Json | null
    visibility: PostVisibility
  },
) {
  const { data, error } = await supabase.rpc("create_post", {
    p_content: values.content,
    p_post_type: values.postType,
    p_media: values.media,
    p_visibility: values.visibility,
  })

  if (error) return { data: null, error }

  const payload = data as CreatePostRpcPayload | null
  if (!payload) return { data: null, error: rpcError("unknown") }
  if (!payload.ok) return { data: null, error: rpcError(payload.error) }

  if (payload.post.author_id !== values.authorId) {
    return {
      data: null,
      error: rpcError("authorMismatch"),
    }
  }

  return {
    data: payload.post,
    error: null,
  }
}

export type UpdatedPostRow = {
  id: number
  content: string
  visibility: PostVisibility
  media: Json | null
  post_type: PostType
  updated_at: string
}

export function updatePost(
  supabase: Supabase,
  postId: number,
  authorId: number,
  patch: {
    content: string
    visibility: PostVisibility
    media?: Json | null
    post_type?: PostType
  },
) {
  return supabase
    .from("posts")
    .update(patch)
    .eq("id", postId)
    .eq("author_id", authorId)
    .is("deleted_at", null)
    .select("id, content, visibility, media, post_type, updated_at")
    .single<UpdatedPostRow>()
}

export function softDeletePost(
  supabase: Supabase,
  postId: number,
  authorId: number,
) {
  return supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", authorId)
}

export function findReaction(
  supabase: Supabase,
  postId: number,
  userId: number,
  reactionType: PostReactionType,
) {
  return supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)
    .maybeSingle<{ id: number }>()
}

export function deleteReaction(supabase: Supabase, reactionId: number) {
  return supabase.from("post_reactions").delete().eq("id", reactionId)
}

export function insertReaction(
  supabase: Supabase,
  postId: number,
  userId: number,
  reactionType: PostReactionType,
) {
  return supabase
    .from("post_reactions")
    .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
}

export type InsertedCommentRow = {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  created_at: string
}

export function insertComment(
  supabase: Supabase,
  values: {
    postId: number
    userId: number
    parentId: number | null
    content: string
  },
) {
  return supabase
    .from("post_comments")
    .insert({
      post_id: values.postId,
      user_id: values.userId,
      parent_id: values.parentId,
      content: values.content,
    })
    .select("id, post_id, user_id, parent_id, content, created_at")
    .single<InsertedCommentRow>()
}

export function softDeleteComment(
  supabase: Supabase,
  commentId: number,
  userId: number,
) {
  return supabase
    .from("post_comments")
    .update({ deleted_at: new Date().toISOString(), status: "deleted" })
    .eq("id", commentId)
    .eq("user_id", userId)
    .select("id, post_id")
    .single<{ id: number; post_id: number }>()
}

export function insertShareRecord(
  supabase: Supabase,
  originalPostId: number,
  userId: number,
  commentContent: string | null,
) {
  return supabase
    .from("post_shares")
    .insert({
      post_id: originalPostId,
      user_id: userId,
      comment_content: commentContent,
    })
    .select("id")
    .single<{ id: number }>()
}

/**
 * Gợi ý người để @mention. Đọc bằng client RLS (profiles không bật RLS nên
 * không cần service-role) và LỌC `profile_visibility != 'private'` ở tầng app
 * — vì DB chưa có policy theo visibility. Trước đây dùng admin client + không
 * lọc → hồ sơ private vẫn lộ trong gợi ý.
 */
export async function searchMentionableProfiles(
  supabase: Supabase,
  query: string,
  limit: number,
): Promise<MentionableUser[]> {
  const like = `%${query.replace(/[%_]/g, (m) => `\\${m}`)}%`

  const [memberRes, companyRes] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url, headline")
      .ilike("full_name", like)
      .neq("profile_visibility", "private")
      .is("deleted_at", null)
      .limit(limit),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url, industry")
      .ilike("name", like)
      .is("deleted_at", null)
      .limit(limit),
  ])

  const out: MentionableUser[] = []
  for (const m of memberRes.data ?? []) {
    if (!m.full_name) continue
    out.push({
      userId: m.user_id,
      displayName: m.full_name,
      avatarUrl: m.avatar_url,
      headline: m.headline,
    })
  }
  for (const c of companyRes.data ?? []) {
    if (!c.name) continue
    out.push({
      userId: c.user_id,
      displayName: c.name,
      avatarUrl: c.logo_url,
      headline: c.industry,
    })
  }

  const ql = query.toLowerCase()
  
  // Schwartzian Transform: Tính toán index 1 lần duy nhất cho mỗi phần tử để tránh gọi toLowerCase/indexOf nhiều lần trong sort
  const mapped = out.map(item => ({
    item,
    matchIndex: item.displayName.toLowerCase().indexOf(ql)
  }))

  mapped.sort((a, b) => a.matchIndex - b.matchIndex)

  return mapped.slice(0, limit).map(x => x.item)
}

export async function insertPollOptions(
  supabase: Supabase,
  postId: number,
  options: string[],
) {
  const rows = options.map((text) => ({
    post_id: postId,
    option_text: text,
  }))
  return supabase
    .from("poll_options")
    .insert(rows)
    .select("id, post_id, option_text, vote_count")
    .returns<PollOptionRow[]>()
}

export async function findPollByPostId(
  supabase: Supabase,
  postId: number,
): Promise<PollOptionRow[]> {
  const { data } = await supabase
    .from("poll_options")
    .select("id, post_id, option_text, vote_count")
    .eq("post_id", postId)
    .order("id", { ascending: true })
    .returns<PollOptionRow[]>()

  return data ?? []
}

export async function findViewerPollVotes(
  supabase: Supabase,
  postId: number,
  userId: number,
): Promise<number[]> {
  const { data } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .returns<{ option_id: number }[]>()

  return data?.map((r) => r.option_id) ?? []
}

export function insertPollVote(
  supabase: Supabase,
  postId: number,
  optionId: number,
  userId: number,
) {
  return supabase
    .from("poll_votes")
    .insert({ post_id: postId, option_id: optionId, user_id: userId })
}


export async function findPollOptionById(
  supabase: Supabase,
  optionId: number,
): Promise<{ id: number; option_text: string } | null> {
  const { data } = await supabase
    .from("poll_options")
    .select("id, option_text")
    .eq("id", optionId)
    .single<{ id: number; option_text: string }>()

  return data
}

export async function replacePollOptions(
  supabase: Supabase,
  postId: number,
  options: { id?: number; optionText: string }[],
) {
  const existing = await findPollByPostId(supabase, postId)
  const existingById = new Map(existing.map((o) => [o.id, o]))
  const incomingIds = new Set(
    options.map((o) => o.id).filter((id): id is number => id != null),
  )

  const toDelete = existing.filter((o) => !incomingIds.has(o.id))
  const toInsert: string[] = []
  const toUpdate: { id: number; text: string }[] = []

  for (const opt of options) {
    if (opt.id && existingById.has(opt.id)) {
      const existingOpt = existingById.get(opt.id)!
      if (existingOpt.option_text !== opt.optionText) {
        toUpdate.push({ id: opt.id, text: opt.optionText })
      }
    } else {
      toInsert.push(opt.optionText)
    }
  }

  const ops: Promise<unknown>[] = []

  if (toDelete.length > 0) {
    ops.push(
      supabase
        .from("poll_options")
        .delete()
        .in("id", toDelete.map((o) => o.id)) as unknown as Promise<unknown>,
    )
  }

  for (const opt of toUpdate) {
    ops.push(
      supabase
        .from("poll_options")
        .update({ option_text: opt.text })
        .eq("id", opt.id) as unknown as Promise<unknown>,
    )
  }

  if (toInsert.length > 0) {
    ops.push(
      supabase
        .from("poll_options")
        .insert(toInsert.map((t) => ({ post_id: postId, option_text: t }))) as unknown as Promise<unknown>,
    )
  }

  await Promise.all(ops)

  return findPollByPostId(supabase, postId)
}
