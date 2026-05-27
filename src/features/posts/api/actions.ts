"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import {
  ActionError,
  action,
  assertOk,
  parse,
  unwrap,
} from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import type { Json, PostType, PostVisibility } from "@/types/database"

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
  deleteReaction,
  findReaction,
  insertComment,
  insertPost,
  insertReaction,
  insertShareRecord,
  searchMentionableProfiles,
  softDeleteComment,
  softDeletePost,
  updatePost,
} from "../data/posts.repo"
import { loadOriginalSnapshot } from "../data/posts.privileged"
import { authorRefFrom, newFeedComment, newFeedPost } from "../lib/map"
import { buildSharedMedia } from "../lib/media"
import {
  notifyComment,
  notifyReaction,
  notifyShare,
} from "../services/post-notifications"
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
  MentionableUser,
  UserPostsPage,
} from "../types"

export type { MentionableUser } from "../types"

function imageMedia(
  mediaItems: { url: string; width?: number; height?: number }[],
): Json | null {
  return mediaItems.length > 0
    ? ({ type: "image", items: mediaItems } as unknown as Json)
    : null
}

// ── Reads (RLS lo việc lọc; trả thẳng domain, không bọc ActionResult) ─────────

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
  return action("posts.errors", async (t) => {
    const id = parse(createPostIdSchema(t), postId)
    return loadPostComments(id)
  })
}

export async function searchMentionableUsersAction(
  query: string,
  limit = 8,
): Promise<MentionableUser[]> {
  const q = query.trim()
  if (q.length === 0) return []
  await requireCurrentUser()
  const supabase = await createClient()
  return searchMentionableProfiles(supabase, q, limit)
}

// ── Writes ────────────────────────────────────────────────────────────────

export async function createPostAction(input: {
  content: string
  visibility?: "public" | "connections" | "private"
  mediaItems?: { url: string; width?: number; height?: number }[]
}): Promise<ActionResult<FeedPost>> {
  return action("posts.errors", async (t) => {
    const data = parse(createPostInputSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    const hasMedia = data.mediaItems.length > 0
    const row = unwrap(
      await insertPost(supabase, {
        authorId: current.appUser.id,
        content: data.content,
        postType: hasMedia ? "image" : "text",
        media: imageMedia(data.mediaItems),
        visibility: data.visibility,
      }),
      "createFailed",
    )

    revalidatePath("/home")

    return newFeedPost({
      id: row.id,
      authorId: row.author_id,
      content: row.content,
      postType: row.post_type,
      media: row.media,
      visibility: row.visibility,
      createdAt: row.created_at,
      author: authorRefFrom(current),
    })
  })
}

export async function toggleReactionAction(
  postId: number,
): Promise<ActionResult<{ reacted: boolean }>> {
  return action("posts.errors", async (t) => {
    const data = parse(createReactionInputSchema(t), {
      postId,
      reactionType: "like",
    })
    const current = await requireCurrentUser()
    const supabase = await createClient()
    const me = current.appUser.id

    const { data: existing } = await findReaction(
      supabase,
      data.postId,
      me,
      data.reactionType,
    )

    if (existing) {
      assertOk(await deleteReaction(supabase, existing.id), "unexpected")
      return { reacted: false }
    }

    assertOk(
      await insertReaction(supabase, data.postId, me, data.reactionType),
      "unexpected",
    )
    await notifyReaction({
      postId: data.postId,
      reactionType: data.reactionType,
      current,
    })
    return { reacted: true }
  })
}

export async function createCommentAction(input: {
  postId: number
  content: string
  parentId?: number | null
}): Promise<ActionResult<{ comment: FeedComment }>> {
  return action("posts.errors", async (t) => {
    const data = parse(createCommentInputSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    const row = unwrap(
      await insertComment(supabase, {
        postId: data.postId,
        userId: current.appUser.id,
        parentId: data.parentId ?? null,
        content: data.content,
      }),
      "commentFailed",
    )

    await notifyComment({
      comment: { id: row.id, postId: row.post_id, content: row.content },
      parentId: data.parentId ?? null,
      current,
    })

    return { comment: newFeedComment(row, authorRefFrom(current)) }
  })
}

export async function deleteCommentAction(
  commentId: number,
): Promise<ActionResult<{ commentId: number; postId: number }>> {
  return action("posts.errors", async (t) => {
    const id = parse(createCommentIdSchema(t), commentId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    const row = unwrap(
      await softDeleteComment(supabase, id, current.appUser.id),
      "deleteCommentFailed",
    )
    return { commentId: row.id, postId: row.post_id }
  })
}

export async function sharePostAction(input: {
  postId: number
  commentContent?: string | null
}): Promise<ActionResult<{ shareId: number; post: FeedPost }>> {
  return action("posts.errors", async (t) => {
    const data = parse(createShareInputSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    const snapshot = await loadOriginalSnapshot(data.postId)
    if (!snapshot) throw ActionError.key("invalidPost")

    const sharedMedia = buildSharedMedia(snapshot)
    const commentText = (data.commentContent ?? "").trim()

    // Bài share là 1 row thật trong `posts` (post_type='text') để xuất hiện
    // trên feed/profile người chia sẻ; metadata original nằm trong `media`.
    const newPostRow = unwrap(
      await insertPost(supabase, {
        authorId: current.appUser.id,
        content: commentText,
        postType: "text",
        media: sharedMedia,
        visibility: "public",
      }),
      "shareFailed",
    )

    const shareRes = await insertShareRecord(
      supabase,
      snapshot.id,
      current.appUser.id,
      commentText ? commentText : null,
    )
    if (shareRes.error || !shareRes.data) {
      // Rollback wrapper post nếu post_shares fail — counters không lệch.
      await softDeletePost(supabase, newPostRow.id, current.appUser.id)
      console.error("[db:shareFailed]", shareRes.error)
      throw ActionError.key("shareFailed")
    }

    revalidatePath("/home")
    await notifyShare({
      snapshot,
      shareId: shareRes.data.id,
      commentText,
      current,
    })

    const post = newFeedPost({
      id: newPostRow.id,
      authorId: current.appUser.id,
      content: commentText,
      postType: "text",
      media: sharedMedia,
      visibility: "public",
      createdAt: newPostRow.created_at,
      author: authorRefFrom(current),
    })

    return { shareId: shareRes.data.id, post }
  })
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
    visibility: PostVisibility
    media: Json | null
    postType: PostType
    updatedAt: string
  }>
> {
  return action("posts.errors", async (t) => {
    const data = parse(createPostUpdateSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    const patch: {
      content: string
      visibility: PostVisibility
      media?: Json | null
      post_type?: PostType
    } = {
      content: data.content,
      visibility: data.visibility,
    }
    if (data.mediaItems !== undefined) {
      const hasMedia = data.mediaItems.length > 0
      patch.media = imageMedia(data.mediaItems)
      patch.post_type = hasMedia ? "image" : "text"
    }

    const row = unwrap(
      await updatePost(supabase, data.postId, current.appUser.id, patch),
      "updateFailed",
    )

    revalidatePath("/home")

    return {
      postId: row.id,
      content: row.content,
      visibility: row.visibility,
      media: row.media,
      postType: row.post_type,
      updatedAt: row.updated_at,
    }
  })
}

export async function deletePostAction(
  postId: number,
): Promise<ActionResult> {
  return action("posts.errors", async (t) => {
    const id = parse(createPostIdSchema(t), postId)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    assertOk(
      await softDeletePost(supabase, id, current.appUser.id),
      "unexpected",
    )
    revalidatePath("/home")
  })
}
