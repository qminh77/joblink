"use server"

import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { searchMentionableProfiles } from "../data/posts.repo"
import { createPostIdSchema } from "../schemas"
import type {
  FeedComment,
  FeedPage,
  HomeFeedStats,
  MentionableUser,
  UserPostsPage,
} from "../types"
import {
  loadFeedPage,
  loadHomeStats,
  loadPostComments,
  loadUserPosts,
} from "./queries"

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
