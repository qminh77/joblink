import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"
import type { Json, PostType, PostVisibility } from "@/types/database"

import {
  deleteReaction,
  findPollByPostId,
  findPollOptionById,
  findReaction,
  findViewerPollVotes,
  incrementOptionVoteCount,
  insertComment,
  insertPollOptions,
  insertPollVote,
  insertPost,
  insertReaction,
  insertShareRecord,
  replacePollOptions,
  softDeleteComment,
  softDeletePost,
  updatePost,
} from "../data/posts.repo"
import { loadOriginalSnapshot } from "../data/posts.privileged"
import { authorRefFrom, newFeedComment, newFeedPost } from "../lib/map"
import { buildSharedMedia } from "../lib/media"
import { buildPollMedia } from "../lib/poll"
import type {
  CommentInput,
  PollInput,
  PostInput,
  PostUpdateInput,
  ShareInput,
  UpdatePollInput,
  VoteInput,
} from "../schemas"
import {
  notifyComment,
  notifyPollVote,
  notifyReaction,
  notifyShare,
} from "./post-notifications"
import type {
  CreateCommentResult,
  DeleteCommentResult,
  FeedPost,
  SharePostResult,
  ToggleReactionResult,
  UpdatePostResult,
  VoteResult,
} from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

type ReactionInput = {
  postId: number
  reactionType: "like" | "celebrate" | "support" | "love" | "insightful" | "funny"
}

function imageMedia(
  mediaItems: { url: string; width?: number; height?: number }[],
): Json | null {
  return mediaItems.length > 0
    ? ({ type: "image", items: mediaItems } as unknown as Json)
    : null
}

export async function createPollPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PollInput,
): Promise<FeedPost> {
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType: "poll",
      media: null,
      visibility: data.visibility,
    }),
    "createFailed",
  )

  const inserted = unwrap(
    await insertPollOptions(supabase, row.id, data.options),
    "createFailed",
  )

  const pollOptions = inserted.map((option) => ({
    id: option.id,
    optionText: option.option_text,
    voteCount: option.vote_count,
  }))

  const updated = unwrap(
    await updatePost(supabase, row.id, current.appUser.id, {
      content: row.content,
      visibility: row.visibility,
      media: buildPollMedia(pollOptions, 0),
    }),
    "createFailed",
  )

  return newFeedPost({
    id: row.id,
    authorId: current.appUser.id,
    content: row.content,
    postType: "poll",
    media: updated.media,
    visibility: row.visibility,
    createdAt: row.created_at,
    author: authorRefFrom(current),
    pollOptions: inserted.map((option) => ({
      id: option.id,
      optionText: option.option_text,
      voteCount: option.vote_count,
      viewerVoted: false,
    })),
  })
}

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
  assertOk(await incrementOptionVoteCount(supabase, data.optionId), "voteFailed")

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

export async function updatePollPost(
  supabase: Supabase,
  current: CurrentUser,
  data: UpdatePollInput,
): Promise<UpdatePostResult> {
  const existingOptions = await findPollByPostId(supabase, data.postId)
  const incomingIds = new Set(
    data.options.map((option) => option.id).filter((id): id is number => id != null),
  )
  for (const option of existingOptions) {
    if (option.vote_count > 0 && !incomingIds.has(option.id)) {
      throw ActionError.key("votedOptionRemoveBlocked")
    }
  }

  const updatedOptions = await replacePollOptions(
    supabase,
    data.postId,
    data.options,
  )
  const totalVotes = updatedOptions.reduce(
    (sum, option) => sum + option.vote_count,
    0,
  )
  const pollOptions = updatedOptions.map((option) => ({
    id: option.id,
    optionText: option.option_text,
    voteCount: option.vote_count,
  }))

  const row = unwrap(
    await updatePost(supabase, data.postId, current.appUser.id, {
      content: data.content,
      visibility: data.visibility,
      media: buildPollMedia(pollOptions, totalVotes),
    }),
    "updateFailed",
  )

  return {
    postId: row.id,
    content: row.content,
    visibility: row.visibility,
    media: row.media,
    postType: "poll",
    updatedAt: row.updated_at,
    pollOptions,
  }
}

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
}
