import "server-only"

// SRS UC Trace - M04:
// UC-26 Xem bang tin; UC-33 Xem chi tiet bai viet.
// Flow: /home|/posts/[id] -> server query -> posts repo/RPC -> feed/detail data with visibility rules.

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/features/auth/lib/constants"
import type {
  FeedComment,
  FeedPage,
  FeedPost,
  HomeFeedPayload,
  HomeFeedStats,
  UserPostsPage,
} from "../types"
import { clampCommentsLimit } from "../lib/comments"

const EMPTY_STATS: HomeFeedStats = {
  connection_count: 0,
  profile_view_count: 0,
}

const DEFAULT_POSTS_LIMIT = 20
const DEFAULT_SUGGESTION_LIMIT = 4

type RpcResponse = HomeFeedPayload | null

function normalize(payload: RpcResponse): HomeFeedPayload {
  if (!payload) {
    return {
      stats: { connection_count: 0, profile_view_count: 0 },
      suggestions: [],
      suggested_jobs: [],
      posts: [],
      jobs: [],
      connection_ids: [],
      me: null,
      next_cursor: null,
    }
  }
  return {
    stats: payload.stats ?? { connection_count: 0, profile_view_count: 0 },
    suggestions: payload.suggestions ?? [],
    suggested_jobs: payload.suggested_jobs ?? [],
    posts: payload.posts ?? [],
    jobs: payload.jobs ?? [],
    connection_ids: payload.connection_ids ?? [],
    me: payload.me ?? null,
    next_cursor: payload.next_cursor ?? null,
  }
}

export async function loadHomeFeed(options?: {
  cursor?: string | null
  postsLimit?: number
  suggestionLimit?: number
}): Promise<HomeFeedPayload> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_home_feed", {
    p_posts_cursor: options?.cursor ?? null,
    p_posts_limit: options?.postsLimit ?? DEFAULT_POSTS_LIMIT,
    p_suggestion_limit: options?.suggestionLimit ?? DEFAULT_SUGGESTION_LIMIT,
  })

  if (error) {
    console.error("[loadHomeFeed] RPC error", error)
    return normalize(null)
  }

  return normalize(data as unknown as RpcResponse)
}

export async function loadFeedPage(
  cursor: string | null,
  limit = DEFAULT_POSTS_LIMIT,
): Promise<FeedPage> {
  const payload = await loadHomeFeed({ cursor, postsLimit: limit })
  return {
    posts: payload.posts,
    jobs: payload.jobs,
    nextCursor: payload.next_cursor,
  }
}

const DEFAULT_USER_POSTS_LIMIT = 10

type UserPostsRpcResponse = {
  posts?: FeedPost[]
  next_cursor?: string | null
  can_view?: boolean
} | null

export async function loadUserPosts(
  targetUserId: number,
  cursor: string | null = null,
  limit = DEFAULT_USER_POSTS_LIMIT,
): Promise<UserPostsPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_user_posts", {
    p_target_user_id: targetUserId,
    p_posts_cursor: cursor,
    p_posts_limit: limit,
  })

  if (error) {
    console.error("[loadUserPosts] RPC error", error)
    return { posts: [], nextCursor: null, canView: false }
  }

  const payload = data as unknown as UserPostsRpcResponse
  return {
    posts: payload?.posts ?? [],
    nextCursor: payload?.next_cursor ?? null,
    canView: payload?.can_view ?? true,
  }
}

/**
 * Lấy danh sách comment của 1 post + author (role/displayName/avatar/headline).
 *
 * Dùng 3 query tuần tự thay vì 1 embed lồng — tránh ambiguous FK giữa
 * `users` và `company_profiles` (có cả `fk_company_profile_user` và
 * `fk_company_verified_by`), đồng thời tránh sai author do PostgREST trả về
 * embed một-tới-nhiều dưới dạng array khác kỳ vọng. Cách này guarantee mỗi
 * `user_id` map đúng tới đúng author.
 */
export async function loadPostComments(
  postId: number,
  limit?: number,
): Promise<FeedComment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_post_comments", {
    p_post_id: postId,
    p_limit: clampCommentsLimit(limit),
  })

  if (error) {
    console.error("[loadPostComments] RPC error", error)
    return []
  }

  return (data as unknown as FeedComment[]) ?? []
}

export async function loadSinglePost(
  postId: number,
): Promise<FeedPost | null> {
  const current = await getCurrentUser()
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, post_type, media, visibility, created_at, reaction_count, comment_count, share_count",
    )
    .eq("id", postId)
    .is("deleted_at", null)
    .eq("status", "active")
    .maybeSingle<{
      id: number
      author_id: number
      content: string
      post_type: string
      media: unknown
      visibility: string
      created_at: string
      reaction_count: number
      comment_count: number
      share_count: number
    }>()

  if (!post) return null

  const [usersRes, memberRes, companyRes, reactedRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, role")
      .eq("id", post.author_id)
      .single<{ id: number; role: UserRole }>(),
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url, headline")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url, industry")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("post_reactions")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)
      .eq("user_id", current?.appUser.id ?? 0),
  ])

  const role = usersRes.data?.role ?? "member"
  const member = memberRes.data
  const company = companyRes.data
  const displayName = member?.full_name ?? company?.name ?? "JobLink"
  const avatarUrl = member?.avatar_url ?? company?.logo_url ?? null
  const headline = member?.headline ?? company?.industry ?? null

  return {
    id: post.id,
    authorId: post.author_id,
    content: post.content,
    postType: post.post_type as FeedPost["postType"],
    media: post.media as FeedPost["media"],
    visibility: post.visibility as FeedPost["visibility"],
    createdAt: post.created_at,
    author: {
      userId: post.author_id,
      role,
      displayName,
      avatarUrl,
      headline,
    },
    reactionCount: post.reaction_count,
    commentCount: post.comment_count,
    shareCount: post.share_count,
    viewerReacted: (reactedRes.count ?? 0) > 0,
  }
}

export async function loadHomeStats(): Promise<HomeFeedStats> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_STATS

  return {
    connection_count: current.appUser.connection_count,
    profile_view_count: current.appUser.profile_view_count,
  }
}

export type { FeedPost }
