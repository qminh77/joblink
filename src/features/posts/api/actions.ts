"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { action, parse } from "@/lib/action/server"
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
    const supabase = await createClient()

    const hasPoll = Array.isArray(input.options) && input.options.length >= 2
    if (hasPoll) {
      const data = parse(createPollInputSchema(t), input)
      const post = await createPollPost(supabase, current, data)
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
      revalidateHome()
      return post
    }

    const data = parse(createPostInputSchema(t), input)
    const post = await createStandardPost(supabase, current, data)
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
    const supabase = await createClient()
    return togglePostReaction(supabase, current, data)
  })
}

export async function voteAction(
  postId: number,
  optionId: number,
): Promise<ActionResult<VoteResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createVoteInputSchema(t), { postId, optionId })
    const current = await requireCurrentUser()
    const supabase = await createClient()
    return voteOnPoll(supabase, current, data)
  })
}

export async function createCommentAction(
  input: CreateCommentActionInput,
): Promise<ActionResult<CreateCommentResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createCommentInputSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    return createPostComment(supabase, current, data)
  })
}

export async function deleteCommentAction(
  commentId: number,
): Promise<ActionResult<DeleteCommentResult>> {
  return action("posts.errors", async (t) => {
    const id = parse(createCommentIdSchema(t), commentId)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    return deletePostComment(supabase, current, id)
  })
}

export async function sharePostAction(
  input: SharePostActionInput,
): Promise<ActionResult<SharePostResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createShareInputSchema(t), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    const result = await shareFeedPost(supabase, current, data)
    revalidateHome()
    return result
  })
}

export async function updatePostAction(
  input: UpdatePostActionInput,
): Promise<ActionResult<UpdatePostResult>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    const supabase = await createClient()

    if (input.options) {
      const data = parse(createUpdatePollSchema(t), input)
      const result = await updatePollPost(supabase, current, data)
      revalidateHome()
      return result
    }

    const data = parse(createPostUpdateSchema(t), input)
    const result = await updateStandardPost(supabase, current, data)
    revalidateHome()
    return result
  })
}

export async function deletePostAction(postId: number): Promise<ActionResult> {
  return action("posts.errors", async (t) => {
    const id = parse(createPostIdSchema(t), postId)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    await deleteOwnPost(supabase, current, id)
    revalidateHome()
  })
}
