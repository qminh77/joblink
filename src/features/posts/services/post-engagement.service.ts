import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import {
  deleteReaction,
  findPollOptionById,
  findReaction,
  findViewerPollVotes,
  insertComment,
  insertPollVote,
  insertPost,
  insertReaction,
  insertShareRecord,
  softDeleteComment,
  softDeletePost,
} from "../data/posts.repo"
import { loadOriginalSnapshot } from "../data/posts.privileged"
import { authorRefFrom, newFeedComment, newFeedPost } from "../lib/map"
import { buildSharedMedia } from "../lib/media"
import type { CommentInput, ShareInput, VoteInput } from "../schemas"
import type {
  CreateCommentResult,
  DeleteCommentResult,
  SharePostResult,
  ToggleReactionResult,
  VoteResult,
} from "../types"
import {
  notifyComment,
  notifyPollVote,
  notifyReaction,
  notifyShare,
} from "./post-notifications"

type Supabase = Awaited<ReturnType<typeof createClient>>

type ReactionInput = {
  postId: number
  reactionType: "like" | "celebrate" | "support" | "love" | "insightful" | "funny"
}

export async function togglePostReaction(
  supabase: Supabase,
  current: CurrentUser,
  data: ReactionInput,
): Promise<ToggleReactionResult> {
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
}

export async function voteOnPoll(
  supabase: Supabase,
  current: CurrentUser,
  data: VoteInput,
): Promise<VoteResult> {
  const me = current.appUser.id
  const existingVotes = await findViewerPollVotes(supabase, data.postId, me)
  if (existingVotes.length > 0) {
    throw ActionError.key("alreadyVoted")
  }

  assertOk(
    await insertPollVote(supabase, data.postId, data.optionId, me),
    "voteFailed",
  )

  const option = await findPollOptionById(supabase, data.optionId)
  if (option) {
    await notifyPollVote({
      postId: data.postId,
      optionText: option.option_text,
      current,
    })
  }

  return { optionId: data.optionId, postId: data.postId }
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
    await softDeletePost(supabase, newPostRow.id, current.appUser.id)
    console.error("[db:shareFailed]", shareRes.error)
    throw ActionError.key("shareFailed")
  }

  await notifyShare({
    snapshot,
    shareId: shareRes.data.id,
    commentText,
    current,
  })

  return {
    shareId: shareRes.data.id,
    post: newFeedPost({
      id: newPostRow.id,
      authorId: current.appUser.id,
      content: commentText,
      postType: "text",
      media: sharedMedia,
      visibility: "public",
      createdAt: newPostRow.created_at,
      author: authorRefFrom(current),
    }),
  }
}
