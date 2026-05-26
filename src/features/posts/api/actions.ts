"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createNotification } from "@/features/notifications/lib/create-notification"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

import {
  createCommentIdSchema,
  createCommentInputSchema,
  createPostIdSchema,
  createPostInputSchema,
  createPostUpdateSchema,
  createReactionInputSchema,
  createShareInputSchema,
} from "../schemas"
import {
  extractMentionedUserIds,
  mentionsToPlainText,
} from "../lib/mentions"
import { buildSharedMedia, readSharedOriginal } from "../lib/media"
import type { SharedOriginal } from "../lib/media"
import type { UserRole } from "@/lib/constants"
import {
  loadFeedPage,
  loadHomeStats,
  loadPostComments,
  loadUserPosts,
} from "./queries"
import type {
  FeedComment,
  FeedPage,
  FeedPost,
  HomeFeedStats,
  UserPostsPage,
} from "../types"

export type MentionableUser = {
  userId: number
  displayName: string
  avatarUrl: string | null
  headline: string | null
}

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

function excerpt(text: string, max = 140): string {
  const trimmed = text.trim().replace(/\s+/g, " ")
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

async function getPostAuthor(postId: number): Promise<number | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<{ author_id: number }>()
  return data?.author_id ?? null
}

async function getCommentAuthor(commentId: number): Promise<number | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("post_comments")
    .select("user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle<{ user_id: number }>()
  return data?.user_id ?? null
}

export async function getFeedPageAction(
  cursor: string | null,
): Promise<FeedPage> {
  return loadFeedPage(cursor)
}

export async function getHomeStatsAction(): Promise<HomeFeedStats> {
  return loadHomeStats()
}

export async function getUserPostsPageAction(
  targetUserId: number,
  cursor: string | null,
): Promise<UserPostsPage> {
  return loadUserPosts(targetUserId, cursor)
}

export async function getPostCommentsAction(
  postId: number,
): Promise<ActionResult<FeedComment[]>> {
  const te = await getTranslations("posts.errors")
  const parsed = createPostIdSchema(te).safeParse(postId)
  if (!parsed.success) return fail(te("invalidPost"))
  try {
    const comments = await loadPostComments(parsed.data)
    return ok(comments)
  } catch (error) {
    console.error("[getPostCommentsAction]", error)
    return fail(te("loadCommentsFailed"))
  }
}

export async function createPostAction(input: {
  content: string
  visibility?: "public" | "connections" | "private"
  mediaItems?: { url: string; width?: number; height?: number }[]
}): Promise<ActionResult<FeedPost>> {
  const te = await getTranslations("posts.errors")
  const parsed = createPostInputSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const hasMedia = parsed.data.mediaItems.length > 0
  const mediaPayload = hasMedia
    ? { type: "image", items: parsed.data.mediaItems }
    : null

  const { data: row, error } = await supabase
    .from("posts")
    .insert({
      author_id: current.appUser.id,
      content: parsed.data.content,
      post_type: hasMedia ? "image" : "text",
      media: mediaPayload,
      visibility: parsed.data.visibility,
    })
    .select("id, author_id, content, post_type, media, visibility, created_at")
    .single()

  if (error || !row) return fail(error?.message ?? te("createFailed"))

  revalidatePath("/home")

  const author: FeedPost["author"] = {
    userId: current.appUser.id,
    role: current.appUser.role,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
    headline: current.profile.headline,
  }

  return ok({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    media: row.media,
    visibility: row.visibility,
    createdAt: row.created_at,
    author,
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewerReacted: false,
  })
}

export async function toggleReactionAction(
  postId: number,
): Promise<ActionResult<{ reacted: boolean }>> {
  const te = await getTranslations("posts.errors")
  const parsed = createReactionInputSchema(te).safeParse({
    postId,
    reactionType: "like",
  })
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()
  const me = current.appUser.id

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", parsed.data.postId)
    .eq("user_id", me)
    .eq("reaction_type", parsed.data.reactionType)
    .maybeSingle<{ id: number }>()

  if (existing) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("id", existing.id)
    if (error) return fail(error.message)
    return ok({ reacted: false })
  }

  const { error } = await supabase.from("post_reactions").insert({
    post_id: parsed.data.postId,
    user_id: me,
    reaction_type: parsed.data.reactionType,
  })
  if (error) return fail(error.message)

  // Notification cho tác giả (không tự thông báo mình)
  const authorId = await getPostAuthor(parsed.data.postId)
  if (authorId && authorId !== me) {
    await createNotification({
      userId: authorId,
      type: "post_reaction",
      payload: {
        type: "post_reaction",
        userId: me,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        postId: parsed.data.postId,
        reactionType: parsed.data.reactionType,
      },
    })
  }

  return ok({ reacted: true })
}

export async function createCommentAction(input: {
  postId: number
  content: string
  parentId?: number | null
}): Promise<ActionResult<{ comment: FeedComment }>> {
  const te = await getTranslations("posts.errors")
  const parsed = createCommentInputSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: parsed.data.postId,
      user_id: current.appUser.id,
      parent_id: parsed.data.parentId ?? null,
      content: parsed.data.content,
    })
    .select("id, post_id, user_id, parent_id, content, created_at")
    .single<{
      id: number
      post_id: number
      user_id: number
      parent_id: number | null
      content: string
      created_at: string
    }>()

  if (error || !data) return fail(error?.message ?? te("commentFailed"))

  const comment: FeedComment = {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    parentId: data.parent_id,
    content: data.content,
    createdAt: data.created_at,
    author: {
      userId: current.appUser.id,
      role: current.appUser.role,
      displayName: current.profile.displayName,
      avatarUrl: current.profile.avatarUrl,
      headline: current.profile.headline,
    },
  }

  const me = current.appUser.id
  const previewExcerpt = excerpt(mentionsToPlainText(data.content))

  // Bước 1: notify post author + parent comment author (nếu là reply).
  const commentTargets = new Set<number>()
  const postAuthorId = await getPostAuthor(parsed.data.postId)
  if (postAuthorId && postAuthorId !== me) commentTargets.add(postAuthorId)
  if (parsed.data.parentId) {
    const parentAuthorId = await getCommentAuthor(parsed.data.parentId)
    if (parentAuthorId && parentAuthorId !== me) commentTargets.add(parentAuthorId)
  }

  const actor = {
    userId: me,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
    postId: parsed.data.postId,
    commentId: data.id,
    excerpt: previewExcerpt,
  }

  // Bước 2: notify mention — chỉ gửi cho user chưa nằm trong commentTargets,
  // tránh 1 người nhận trùng 2 noti cho cùng 1 comment.
  const mentionedIds = extractMentionedUserIds(data.content)
  const mentionTargets = new Set<number>()
  for (const id of mentionedIds) {
    if (id === me) continue
    if (commentTargets.has(id)) continue
    mentionTargets.add(id)
  }

  await Promise.all([
    ...Array.from(commentTargets).map((userId) =>
      createNotification({
        userId,
        type: "post_comment",
        payload: { type: "post_comment", ...actor },
      }),
    ),
    ...Array.from(mentionTargets).map((userId) =>
      createNotification({
        userId,
        type: "comment_mention",
        payload: { type: "comment_mention", ...actor },
      }),
    ),
  ])

  return ok({ comment })
}

export async function searchMentionableUsersAction(
  query: string,
  limit = 8,
): Promise<MentionableUser[]> {
  const q = query.trim()
  if (q.length === 0) return []

  await requireCurrentUser()
  const admin = createAdminClient()
  const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`

  const [memberRes, companyRes] = await Promise.all([
    admin
      .from("member_profiles")
      .select("user_id, full_name, avatar_url, headline")
      .ilike("full_name", like)
      .is("deleted_at", null)
      .limit(limit),
    admin
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
  // Sort theo độ khớp prefix > rồi đến substring; ngắt ở `limit`.
  const ql = q.toLowerCase()
  out.sort((a, b) => {
    const ai = a.displayName.toLowerCase().indexOf(ql)
    const bi = b.displayName.toLowerCase().indexOf(ql)
    return ai - bi
  })
  return out.slice(0, limit)
}

export async function deleteCommentAction(
  commentId: number,
): Promise<ActionResult<{ commentId: number; postId: number }>> {
  const te = await getTranslations("posts.errors")
  const parsed = createCommentIdSchema(te).safeParse(commentId)
  if (!parsed.success) return fail(te("invalidComment"))

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("post_comments")
    .update({
      deleted_at: new Date().toISOString(),
      status: "deleted",
    })
    .eq("id", parsed.data)
    .eq("user_id", current.appUser.id)
    .select("id, post_id")
    .single<{ id: number; post_id: number }>()

  if (error || !data) return fail(error?.message ?? te("deleteCommentFailed"))
  return ok({ commentId: data.id, postId: data.post_id })
}

async function loadOriginalSnapshot(
  postId: number,
): Promise<SharedOriginal | null> {
  const admin = createAdminClient()
  const { data: row } = await admin
    .from("posts")
    .select("id, author_id, content, post_type, media, created_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: number
      author_id: number
      content: string
      post_type: import("@/types/database").PostType
      media: import("@/types/database").Json | null
      created_at: string
    }>()

  if (!row) return null

  // Nếu post được share đã là 1 share khác → "đào" snapshot original gốc,
  // tránh share-lồng-share không cần thiết.
  const nested = readSharedOriginal(row.media)
  if (nested) return nested

  const [userRes, memberRes, companyRes] = await Promise.all([
    admin
      .from("users")
      .select("id, role")
      .eq("id", row.author_id)
      .maybeSingle<{ id: number; role: UserRole }>(),
    admin
      .from("member_profiles")
      .select("full_name, avatar_url, headline")
      .eq("user_id", row.author_id)
      .is("deleted_at", null)
      .maybeSingle<{
        full_name: string | null
        avatar_url: string | null
        headline: string | null
      }>(),
    admin
      .from("company_profiles")
      .select("name, logo_url, industry")
      .eq("user_id", row.author_id)
      .is("deleted_at", null)
      .maybeSingle<{
        name: string | null
        logo_url: string | null
        industry: string | null
      }>(),
  ])

  const role: UserRole = userRes.data?.role ?? "member"
  const displayName =
    role === "company"
      ? companyRes.data?.name ?? memberRes.data?.full_name ?? "JobLink"
      : memberRes.data?.full_name ?? companyRes.data?.name ?? "JobLink"
  const avatarUrl =
    role === "company"
      ? companyRes.data?.logo_url ?? memberRes.data?.avatar_url ?? null
      : memberRes.data?.avatar_url ?? companyRes.data?.logo_url ?? null
  const headline =
    role === "company"
      ? companyRes.data?.industry ?? memberRes.data?.headline ?? null
      : memberRes.data?.headline ?? companyRes.data?.industry ?? null

  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    media: row.media,
    createdAt: row.created_at,
    author: { userId: row.author_id, role, displayName, avatarUrl, headline },
  }
}

export async function sharePostAction(input: {
  postId: number
  commentContent?: string | null
}): Promise<ActionResult<{ shareId: number; post: FeedPost }>> {
  const te = await getTranslations("posts.errors")
  const parsed = createShareInputSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const snapshot = await loadOriginalSnapshot(parsed.data.postId)
  if (!snapshot) return fail(te("invalidPost"))

  const sharedMedia = buildSharedMedia(snapshot)
  const commentText = (parsed.data.commentContent ?? "").trim()

  // Bài share là 1 row thật trong `posts` (post_type='text') để xuất hiện
  // trên profile/feed của người chia sẻ; metadata original nằm trong `media`.
  const { data: newPostRow, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: current.appUser.id,
      content: commentText,
      post_type: "text",
      media: sharedMedia,
      visibility: "public",
    })
    .select("id, created_at")
    .single<{ id: number; created_at: string }>()

  if (postError || !newPostRow) {
    return fail(postError?.message ?? te("shareFailed"))
  }

  const { data: shareRow, error: shareError } = await supabase
    .from("post_shares")
    .insert({
      post_id: snapshot.id,
      user_id: current.appUser.id,
      comment_content: commentText ? commentText : null,
    })
    .select("id")
    .single<{ id: number }>()

  if (shareError || !shareRow) {
    // Rollback wrapper post nếu post_shares fail — counters không lệch.
    await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", newPostRow.id)
    return fail(shareError?.message ?? te("shareFailed"))
  }

  revalidatePath("/home")

  if (snapshot.authorId !== current.appUser.id) {
    await createNotification({
      userId: snapshot.authorId,
      type: "post_share",
      payload: {
        type: "post_share",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        postId: snapshot.id,
        shareId: shareRow.id,
        excerpt: commentText ? excerpt(commentText) : null,
      },
    })
  }

  const newPost: FeedPost = {
    id: newPostRow.id,
    authorId: current.appUser.id,
    content: commentText,
    postType: "text",
    media: sharedMedia,
    visibility: "public",
    createdAt: newPostRow.created_at,
    author: {
      userId: current.appUser.id,
      role: current.appUser.role,
      displayName: current.profile.displayName,
      avatarUrl: current.profile.avatarUrl,
      headline: current.profile.headline,
    },
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewerReacted: false,
  }

  return ok({ shareId: shareRow.id, post: newPost })
}

export async function updatePostAction(input: {
  postId: number
  content: string
  visibility: "public" | "connections" | "private"
  mediaItems?: { url: string; width?: number; height?: number }[]
}): Promise<
  ActionResult<{
    postId: number
    content: string
    visibility: "public" | "connections" | "private"
    media: import("@/types/database").Json | null
    postType: import("@/types/database").PostType
    updatedAt: string
  }>
> {
  const te = await getTranslations("posts.errors")
  const parsed = createPostUpdateSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  type UpdatePayload = {
    content: string
    visibility: "public" | "connections" | "private"
    media?: import("@/types/database").Json | null
    post_type?: import("@/types/database").PostType
  }

  const updatePayload: UpdatePayload = {
    content: parsed.data.content,
    visibility: parsed.data.visibility,
  }

  if (parsed.data.mediaItems !== undefined) {
    const hasMedia = parsed.data.mediaItems.length > 0
    updatePayload.media = hasMedia
      ? ({ type: "image", items: parsed.data.mediaItems } as unknown as import("@/types/database").Json)
      : null
    updatePayload.post_type = hasMedia ? "image" : "text"
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", parsed.data.postId)
    .eq("author_id", current.appUser.id)
    .is("deleted_at", null)
    .select("id, content, visibility, media, post_type, updated_at")
    .single<{
      id: number
      content: string
      visibility: "public" | "connections" | "private"
      media: import("@/types/database").Json | null
      post_type: import("@/types/database").PostType
      updated_at: string
    }>()

  if (error || !data) return fail(error?.message ?? te("updateFailed"))

  revalidatePath("/home")

  return ok({
    postId: data.id,
    content: data.content,
    visibility: data.visibility,
    media: data.media,
    postType: data.post_type,
    updatedAt: data.updated_at,
  })
}

export async function deletePostAction(
  postId: number,
): Promise<ActionResult> {
  const te = await getTranslations("posts.errors")
  const parsed = createPostIdSchema(te).safeParse(postId)
  if (!parsed.success) return fail(te("invalidPost"))

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("author_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidatePath("/home")
  return ok(undefined)
}
