"use server"

import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

import { searchMentionableProfiles } from "../data/posts.repo"
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
  createPostComment,
  createStandardPost,
  createVideoPost,
  deleteOwnPost,
  deletePostComment,
  shareFeedPost,
  togglePostReaction,
  updateStandardPost,
} from "../services/post.service"
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
} from "../types"
import {
  loadFeedPage,
  loadHomeStats,
  loadPostComments,
  loadUserPosts,
} from "./queries"
import { revalidateHome } from "./revalidation"

export type { MentionableUser } from "../types"

// --- READ ACTIONS ---

export async function getFeedPageAction(
  cursor: string | null,
): Promise<FeedPage> {
  await requireCurrentUser()
  return loadFeedPage(cursor)
}

export async function getHomeStatsAction(): Promise<HomeFeedStats> {
  await requireCurrentUser()
  return loadHomeStats()
}

export async function getUserPostsPageAction(
  targetUserId: number,
  cursor: string | null,
): Promise<UserPostsPage> {
  await requireCurrentUser()
  return loadUserPosts(targetUserId, cursor)
}

export async function getPostCommentsAction(
  postId: number,
  limit?: number,
): Promise<ActionResult<FeedComment[]>> {
  return action("posts.errors", async (t) => {
    await requireCurrentUser()
    const id = parse(createPostIdSchema(t), postId)
    return loadPostComments(id, limit)
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

// --- CREATE ACTIONS ---

export async function createPostAction(
  input: CreatePostActionInput,
): Promise<ActionResult<FeedPost>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "post", 5, 60) // 5 posts / 60s
    const supabase = await createClient()

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

// --- MANAGE ACTIONS ---

export async function updatePostAction(
  input: UpdatePostActionInput,
): Promise<ActionResult<UpdatePostResult>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 updates / 60s
    const supabase = await createClient()

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
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 deletes / 60s
    const supabase = await createClient()

    await deleteOwnPost(supabase, current, id)

    revalidateHome()
  })
}

// --- ENGAGEMENT ACTIONS ---

export async function toggleReactionAction(
  postId: number,
): Promise<ActionResult<ToggleReactionResult>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    const data = parse(createReactionInputSchema(t), {
      postId,
      reactionType: "like",
    })
    await checkRateLimit(current.appUser.id, "reaction", 30, 60) // 30 reactions / 60s
    const supabase = await createClient()
    
    return togglePostReaction(supabase, current, data)
  })
}

export async function createCommentAction(
  input: CreateCommentActionInput,
): Promise<ActionResult<CreateCommentResult>> {
  return action("posts.errors", async (t) => {
    const current = await requireCurrentUser()
    const data = parse(createCommentInputSchema(t), input)
    await checkRateLimit(current.appUser.id, "comment", 15, 60) // 15 comments / 60s
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
    await checkRateLimit(current.appUser.id, "share", 10, 60) // 10 shares / 60s
    const supabase = await createClient()

    const result = await shareFeedPost(supabase, current, data)
    revalidateHome()
    return result
  })
}

// --- PREVIEW ACTIONS ---

export type PostPreviewData = {
  id: number
  authorId: number
  authorName: string
  authorAvatarUrl: string | null
  content: string
  media: Json | null
  createdAt: string
} | null

export async function getPostPreviewAction(
  postId: number,
): Promise<PostPreviewData> {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, content, media, created_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .eq("status", "active")
    .maybeSingle<{
      id: number
      author_id: number
      content: string
      media: unknown
      created_at: string
    }>()

  if (!post) return null

  const [memberRes, companyRes] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
  ])

  const member = memberRes.data
  const company = companyRes.data
  const authorName = member?.full_name ?? company?.name ?? "JobLink"
  const authorAvatarUrl = member?.avatar_url ?? company?.logo_url ?? null

  return {
    id: post.id,
    authorId: post.author_id,
    authorName,
    authorAvatarUrl,
    content: post.content,
    media: post.media as Json,
    createdAt: post.created_at,
  }
}
