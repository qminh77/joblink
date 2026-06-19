import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { UserRole } from "@/lib/constants"
import type {
  FeedComment,
  FeedPage,
  FeedPost,
  HomeFeedPayload,
  HomeFeedStats,
  UserPostsPage,
} from "../types"

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

type CommentRow = {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  created_at: string
}

type AuthorMeta = {
  role: UserRole
  displayName: string
  avatarUrl: string | null
  headline: string | null
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
  limit = 50,
): Promise<FeedComment[]> {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, parent_id, content, created_at")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(limit)
    .returns<CommentRow[]>()

  if (error) {
    console.error("[loadPostComments] error", error)
    return []
  }

  const comments = rows ?? []
  if (comments.length === 0) return []

  const userIds = Array.from(new Set(comments.map((c) => c.user_id)))

  const admin = createAdminClient()
  const [usersRes, memberRes, companyRes] = await Promise.all([
    admin.from("users").select("id, role").in("id", userIds),
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url, headline")
      .in("user_id", userIds)
      .is("deleted_at", null),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url, industry")
      .in("user_id", userIds)
      .is("deleted_at", null),
  ])

  const roleById = new Map<number, UserRole>()
  for (const u of (usersRes.data ?? []) as { id: number; role: UserRole }[]) {
    roleById.set(u.id, u.role)
  }

  const authorById = new Map<number, AuthorMeta>()
  for (const m of (memberRes.data ?? []) as {
    user_id: number
    full_name: string | null
    avatar_url: string | null
    headline: string | null
  }[]) {
    authorById.set(m.user_id, {
      role: roleById.get(m.user_id) ?? "member",
      displayName: m.full_name ?? "JobLink",
      avatarUrl: m.avatar_url,
      headline: m.headline,
    })
  }
  for (const c of (companyRes.data ?? []) as {
    user_id: number
    name: string | null
    logo_url: string | null
    industry: string | null
  }[]) {
    if (authorById.has(c.user_id)) continue
    authorById.set(c.user_id, {
      role: roleById.get(c.user_id) ?? "company",
      displayName: c.name ?? "JobLink",
      avatarUrl: c.logo_url,
      headline: c.industry,
    })
  }

  return comments.map((row) => {
    const meta = authorById.get(row.user_id) ?? {
      role: roleById.get(row.user_id) ?? "member",
      displayName: "JobLink",
      avatarUrl: null,
      headline: null,
    }
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentId: row.parent_id,
      content: row.content,
      createdAt: row.created_at,
      author: {
        userId: row.user_id,
        role: meta.role,
        displayName: meta.displayName,
        avatarUrl: meta.avatarUrl,
        headline: meta.headline,
      },
    }
  })
}

export async function loadHomeStats(): Promise<HomeFeedStats> {
  const current = await getCurrentUser()
  if (!current) return EMPTY_STATS

  const supabase = await createClient()
  const { data } = await supabase
    .from("users")
    .select("connection_count, profile_view_count")
    .eq("id", current.appUser.id)
    .maybeSingle<HomeFeedStats>()

  return data ?? EMPTY_STATS
}

export type { FeedPost }
