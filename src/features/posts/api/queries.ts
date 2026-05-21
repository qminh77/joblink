import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type {
  FeedPage,
  FeedPost,
  HomeFeedPayload,
  HomeFeedStats,
} from "../types"

const EMPTY_STATS: HomeFeedStats = {
  connection_count: 0,
  profile_view_count: 0,
}

const DEFAULT_POSTS_LIMIT = 20
const DEFAULT_SUGGESTION_LIMIT = 12

type RpcResponse = HomeFeedPayload | null

function normalize(payload: RpcResponse): HomeFeedPayload {
  if (!payload) {
    return {
      stats: { connection_count: 0, profile_view_count: 0 },
      suggestions: [],
      posts: [],
      connection_ids: [],
      me: null,
      next_cursor: null,
    }
  }
  return {
    stats: payload.stats ?? { connection_count: 0, profile_view_count: 0 },
    suggestions: payload.suggestions ?? [],
    posts: payload.posts ?? [],
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
  return { posts: payload.posts, nextCursor: payload.next_cursor }
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
