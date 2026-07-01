"use server"

import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"
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
  await requirePermission("feed.view")
  return loadFeedPage(cursor)
}

export async function getHomeStatsAction(): Promise<HomeFeedStats> {
  await requirePermission("feed.view")
  return loadHomeStats()
}

export async function getUserPostsPageAction(
  targetUserId: number,
  cursor: string | null,
): Promise<UserPostsPage> {
  await requirePermission("posts.view")
  return loadUserPosts(targetUserId, cursor)
}

export async function getPostCommentsAction(
  postId: number,
): Promise<ActionResult<FeedComment[]>> {
  return action("posts.errors", async (t) => {
    await requirePermission("posts.view")
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
  await requirePermission("search.view")
  const supabase = await createClient()
  return searchMentionableProfiles(supabase, q, limit)
}
