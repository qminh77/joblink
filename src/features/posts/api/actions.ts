"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  createCommentInputSchema,
  createPostIdSchema,
  createPostInputSchema,
  createReactionInputSchema,
} from "../schemas"
import { loadFeedPage } from "./queries"
import type { FeedPage, FeedPost } from "../types"

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

export async function getFeedPageAction(
  cursor: string | null,
): Promise<FeedPage> {
  return loadFeedPage(cursor)
}

export async function createPostAction(input: {
  content: string
  visibility?: "public" | "connections" | "private"
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
      post_type: "text",
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
  return ok({ reacted: true })
}

export async function createCommentAction(input: {
  postId: number
  content: string
  parentId?: number | null
}): Promise<ActionResult<{ commentId: number }>> {
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
    .select("id")
    .single()

  if (error || !data) return fail(error?.message ?? te("createFailed"))
  return ok({ commentId: data.id })
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
