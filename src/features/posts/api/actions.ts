"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { writeAuditLog } from "@/lib/audit"
import { action, parse } from "@/lib/action/server"
import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"

import { searchMentionableProfiles } from "../data/posts.repo"
import {
  createCommentIdSchema,
  createCommentInputSchema,
  createPollInputSchema,
  createPostIdSchema,
  createPostInputSchema,
  createPostUpdateSchema,
  createReactionInputSchema,
  createShareInputSchema,
  createUpdatePollSchema,
  createVoteInputSchema,
} from "../schemas"
import {
  createPollPost,
  createPostComment,
  createStandardPost,
  createVideoPost,
  deleteOwnPost,
  deletePostComment,
  shareFeedPost,
  togglePostReaction,
  updatePollPost,
  updateStandardPost,
  voteOnPoll,
} from "../services/post-actions.service"
import {
  loadFeedPage,
  loadHomeStats,
  loadPostComments,
  loadUserPosts,
} from "./queries"
import type {
  CreateCommentActionInput,
  CreateCommentResult,
  CreatePostActionInput,
  DeleteCommentResult,
  FeedComment,
  FeedPage,
  FeedPost,
  HomeFeedStats,
  MentionableUser,
  SharePostActionInput,
  SharePostResult,
  ToggleReactionResult,
  UpdatePostActionInput,
  UpdatePostResult,
  UserPostsPage,
  VoteResult,
} from "../types"

export type { MentionableUser } from "../types"

function revalidateHome() {
  revalidatePath("/home")
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

export async function createPostAction(
  input: CreatePostActionInput,
): Promise<ActionResult<FeedPost>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "post", 5, 60) // 5 posts / 60s
    const supabase = await createClient()

    const hasPoll = Array.isArray(input.options) && input.options.length >= 2
    if (hasPoll) {
      const data = parse(createPollInputSchema(t), input)
      const post = await createPollPost(supabase, current, data)
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "post.create_poll",
        entityType: "posts",
        entityId: post.id,
        newData: { postType: "poll", visibility: data.visibility },
      })
      revalidateHome()
      return post
    }

    const videoUrl =
      typeof input.videoUrl === "string" && input.videoUrl.startsWith("http")
        ? input.videoUrl
        : null
    if (videoUrl) {
      const data = parse(createPostInputSchema(t), { ...input, mediaItems: [] })
      const post = await createVideoPost(supabase, current, data, videoUrl)
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "post.create_video",
        entityType: "posts",
        entityId: post.id,
        newData: { postType: "video", visibility: data.visibility },
      })
      revalidateHome()
      return post
    }

    const data = parse(createPostInputSchema(t), input)
    const post = await createStandardPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.create",
      entityType: "posts",
      entityId: post.id,
      newData: { visibility: data.visibility },
    })
    revalidateHome()
    return post
  })
}

export async function toggleReactionAction(
  postId: number,
): Promise<ActionResult<ToggleReactionResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createReactionInputSchema(t), {
      postId,
      reactionType: "like",
    })
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "reaction", 30, 60) // 30 reactions / 60s
    const supabase = await createClient()
    const result = await togglePostReaction(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.reacted ? "post.reaction_add" : "post.reaction_remove",
      entityType: "post_reactions",
      entityId: postId,
    })
    return result
  })
}

export async function voteAction(
  postId: number,
  optionId: number,
): Promise<ActionResult<VoteResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createVoteInputSchema(t), { postId, optionId })
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "vote", 10, 60) // 10 votes / 60s
    const supabase = await createClient()
    const result = await voteOnPoll(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.poll_vote",
      entityType: "poll_votes",
      entityId: postId,
      newData: { optionId },
    })
    return result
  })
}

export async function createCommentAction(
  input: CreateCommentActionInput,
): Promise<ActionResult<CreateCommentResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createCommentInputSchema(t), input)
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "comment", 15, 60) // 15 comments / 60s
    const supabase = await createClient()
    const result = await createPostComment(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.comment_add",
      entityType: "post_comments",
      entityId: data.postId,
      newData: { content: data.content.substring(0, 200) },
    })
    return result
  })
}

export async function deleteCommentAction(
  commentId: number,
): Promise<ActionResult<DeleteCommentResult>> {
  return action("posts.errors", async (t) => {
    const id = parse(createCommentIdSchema(t), commentId)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    const result = await deletePostComment(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.comment_delete",
      entityType: "post_comments",
      entityId: id,
    })
    return result
  })
}

export async function sharePostAction(
  input: SharePostActionInput,
): Promise<ActionResult<SharePostResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createShareInputSchema(t), input)
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "share", 10, 60) // 10 shares / 60s
    const supabase = await createClient()
    const result = await shareFeedPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.share",
      entityType: "post_shares",
      entityId: data.postId,
    })
    revalidateHome()
    return result
  })
}

export async function updatePostAction(
  input: UpdatePostActionInput,
): Promise<ActionResult<UpdatePostResult>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 updates / 60s
    const supabase = await createClient()

    if (input.options) {
      const data = parse(createUpdatePollSchema(t), input)
      const result = await updatePollPost(supabase, current, data)
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "post.update_poll",
        entityType: "posts",
        entityId: input.postId,
        newData: { optionsCount: input.options.length },
      })
      revalidateHome()
      return result
    }

    const data = parse(createPostUpdateSchema(t), input)
    const result = await updateStandardPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.update",
      entityType: "posts",
      entityId: input.postId,
      newData: { visibility: data.visibility },
    })
    revalidateHome()
    return result
  })
}

export async function deletePostAction(postId: number): Promise<ActionResult> {
  return action("posts.errors", async (t) => {
    const id = parse(createPostIdSchema(t), postId)
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 deletes / 60s
    const supabase = await createClient()
    await deleteOwnPost(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.delete",
      entityType: "posts",
      entityId: id,
    })
    revalidateHome()
  })
}
