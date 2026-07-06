import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import { writeAuditLog } from "@/lib/audit"
import type { createClient } from "@/lib/supabase/server"
import type { Json, PostType, PostVisibility } from "@/types/database"

import { loadOriginalSnapshot } from "../data/posts.privileged"
import {
  insertComment,
  insertPost,
  sharePost as sharePostRpc,
  softDeleteComment,
  softDeletePost,
  togglePostReactionRpc,
  updatePost,
} from "../data/posts.repo"
import { authorRefFrom, newFeedComment, newFeedPost } from "../lib/map"
import { buildSharedJobMedia, buildSharedMedia, imageMedia } from "../lib/media"
import type { CommentInput, PostInput, PostUpdateInput, ShareInput } from "../schemas"
import type {
  CreateCommentResult,
  DeleteCommentResult,
  FeedPost,
  SharePostResult,
  ToggleReactionResult,
  UpdatePostResult,
} from "../types"
import { notifyComment, notifyReaction, notifyShare } from "./post-notifications"

type Supabase = Awaited<ReturnType<typeof createClient>>

// --- CREATE POST ---

export async function createVideoPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostInput,
  videoUrl: string,
): Promise<FeedPost> {
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType: "video",
      media: { type: "video", url: videoUrl } as unknown as Json,
      visibility: data.visibility,
    }),
    "createFailed",
  )

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.create",
    entityType: "posts",
    entityId: row.id,
    newData: { postType: "video", visibility: data.visibility },
  })

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
}

export async function createStandardPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostInput,
): Promise<FeedPost> {
  const sharedJobMedia = data.sharedJob ? buildSharedJobMedia(data.sharedJob) : null
  const hasMedia = !sharedJobMedia && data.mediaItems.length > 0
  const postType = hasMedia ? "image" : "text"
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType,
      media: sharedJobMedia ?? imageMedia(data.mediaItems),
      visibility: data.visibility,
    }),
    "createFailed",
  )

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.create",
    entityType: "posts",
    entityId: row.id,
    newData: { postType, visibility: data.visibility },
  })

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
}

// --- UPDATE POST ---

export async function updateStandardPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostUpdateInput,
): Promise<UpdatePostResult> {
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

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.update",
    entityType: "posts",
    entityId: data.postId,
    newData: { visibility: data.visibility },
  })

  return {
    postId: row.id,
    content: row.content,
    visibility: row.visibility,
    media: row.media,
    postType: row.post_type,
    updatedAt: row.updated_at,
  }
}

export async function deleteOwnPost(
  supabase: Supabase,
  current: CurrentUser,
  postId: number,
): Promise<void> {
  assertOk(
    await softDeletePost(supabase, postId, current.appUser.id),
    "unexpected",
  )

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.delete",
    entityType: "posts",
    entityId: postId,
  })
}

// --- ENGAGEMENT ---

type ReactionInput = {
  postId: number
  reactionType: "like" | "celebrate" | "support" | "love" | "insightful" | "funny"
}

export async function togglePostReaction(
  supabase: Supabase,
  current: CurrentUser,
  data: ReactionInput,
): Promise<ToggleReactionResult> {
  const result = unwrap(
    await togglePostReactionRpc(supabase, data.postId, data.reactionType),
    "unexpected",
  )
  
  if (result.reacted) {
    await notifyReaction({
      postId: data.postId,
      reactionType: data.reactionType,
      current,
    })
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: result.reacted ? "post.reaction_add" : "post.reaction_remove",
    entityType: "post_reactions",
    entityId: data.postId,
  })

  return { reacted: result.reacted }
}

export async function createPostComment(
  supabase: Supabase,
  current: CurrentUser,
  data: CommentInput,
): Promise<CreateCommentResult> {
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

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.comment_add",
    entityType: "post_comments",
    entityId: data.postId,
    newData: { content: data.content.substring(0, 200) },
  })

  return { comment: newFeedComment(row, authorRefFrom(current)) }
}

export async function deletePostComment(
  supabase: Supabase,
  current: CurrentUser,
  commentId: number,
): Promise<DeleteCommentResult> {
  const row = unwrap(
    await softDeleteComment(supabase, commentId, current.appUser.id),
    "deleteCommentFailed",
  )

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.comment_delete",
    entityType: "post_comments",
    entityId: commentId,
  })

  return { commentId: row.id, postId: row.post_id }
}

export async function shareFeedPost(
  supabase: Supabase,
  current: CurrentUser,
  data: ShareInput,
): Promise<SharePostResult> {
  const snapshot = await loadOriginalSnapshot(data.postId)
  if (!snapshot) throw ActionError.key("invalidPost")

  const sharedMedia = buildSharedMedia(snapshot)
  const commentText = (data.commentContent ?? "").trim()

  const result = unwrap(
    await sharePostRpc(supabase, {
      content: commentText,
      originalPostId: snapshot.id,
      commentText: commentText || null,
      media: sharedMedia,
    }),
    "shareFailed",
  )

  await notifyShare({
    snapshot,
    shareId: result.shareId,
    commentText,
    current,
  })

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "post.share",
    entityType: "post_shares",
    entityId: data.postId,
  })

  return {
    shareId: result.shareId,
    post: newFeedPost({
      id: result.postId,
      authorId: current.appUser.id,
      content: commentText,
      postType: "text",
      media: sharedMedia,
      visibility: "public",
      createdAt: new Date().toISOString(),
      author: authorRefFrom(current),
    }),
  }
}
