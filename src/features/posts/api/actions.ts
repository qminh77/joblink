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
  mediaUrl?: string
}): Promise<ActionResult<FeedPost>> {
  const te = await getTranslations("posts.errors")
  const parsed = createPostInputSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("posts")
    .insert({
      author_id: current.appUser.id,
      content: parsed.data.content,
      post_type: parsed.data.mediaUrl ? "image" : "text",
      media: parsed.data.mediaUrl
        ? { url: parsed.data.mediaUrl, type: "image" }
        : null,
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

  const authorId = await getPostAuthor(parsed.data.postId)
  if (authorId && authorId !== current.appUser.id) {
    await createNotification({
      userId: authorId,
      type: "post_comment",
      payload: {
        type: "post_comment",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        postId: parsed.data.postId,
        commentId: data.id,
        excerpt: excerpt(data.content),
      },
    })
  }

  return ok({ comment })
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

export async function sharePostAction(input: {
  postId: number
  commentContent?: string | null
}): Promise<ActionResult<{ shareId: number; postId: number }>> {
  const te = await getTranslations("posts.errors")
  const parsed = createShareInputSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("post_shares")
    .insert({
      post_id: parsed.data.postId,
      user_id: current.appUser.id,
      comment_content: parsed.data.commentContent ?? null,
    })
    .select("id")
    .single<{ id: number }>()

  if (error || !data) return fail(error?.message ?? te("shareFailed"))

  const authorId = await getPostAuthor(parsed.data.postId)
  if (authorId && authorId !== current.appUser.id) {
    await createNotification({
      userId: authorId,
      type: "post_share",
      payload: {
        type: "post_share",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        postId: parsed.data.postId,
        shareId: data.id,
        excerpt: parsed.data.commentContent
          ? excerpt(parsed.data.commentContent)
          : null,
      },
    })
  }

  return ok({ shareId: data.id, postId: parsed.data.postId })
}

export async function updatePostAction(input: {
  postId: number
  content: string
  visibility: "public" | "connections" | "private"
}): Promise<
  ActionResult<{
    postId: number
    content: string
    visibility: "public" | "connections" | "private"
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

  const { data, error } = await supabase
    .from("posts")
    .update({
      content: parsed.data.content,
      visibility: parsed.data.visibility,
    })
    .eq("id", parsed.data.postId)
    .eq("author_id", current.appUser.id)
    .is("deleted_at", null)
    .select("id, content, visibility, updated_at")
    .single<{
      id: number
      content: string
      visibility: "public" | "connections" | "private"
      updated_at: string
    }>()

  if (error || !data) return fail(error?.message ?? te("updateFailed"))

  revalidatePath("/home")

  return ok({
    postId: data.id,
    content: data.content,
    visibility: data.visibility,
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
