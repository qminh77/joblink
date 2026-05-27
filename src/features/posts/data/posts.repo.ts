import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type {
  Json,
  PostReactionType,
  PostType,
  PostVisibility,
} from "@/types/database"

import type { MentionableUser } from "../types"

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

export function insertPost(
  supabase: Supabase,
  values: {
    authorId: number
    content: string
    postType: PostType
    media: Json | null
    visibility: PostVisibility
  },
) {
  return supabase
    .from("posts")
    .insert({
      author_id: values.authorId,
      content: values.content,
      post_type: values.postType,
      media: values.media,
      visibility: values.visibility,
    })
    .select("id, author_id, content, post_type, media, visibility, created_at")
    .single<InsertedPostRow>()
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
  out.sort((a, b) => {
    const ai = a.displayName.toLowerCase().indexOf(ql)
    const bi = b.displayName.toLowerCase().indexOf(ql)
    return ai - bi
  })
  return out.slice(0, limit)
}
