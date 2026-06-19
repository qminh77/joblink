"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import {
  getFeedPageAction,
  getHomeStatsAction,
  getPostCommentsAction,
  getUserPostsPageAction,
} from "../api/actions"
import type {
  FeedComment,
  FeedPage,
  HomeFeedStats,
  UserPostsPage,
} from "../types"
import {
  FEED_QUERY_KEY,
  HOME_STATS_KEY,
  POST_COMMENTS_KEY,
  USER_POSTS_QUERY_KEY,
} from "./keys"

export function useHomeFeed(initialPage: FeedPage) {
  return useInfiniteQuery<FeedPage>({
    queryKey: FEED_QUERY_KEY,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getFeedPageAction(pageParam as string | null),
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
  })
}

export function useUserPosts(userId: number, initialPage: UserPostsPage) {
  return useInfiniteQuery<UserPostsPage>({
    queryKey: USER_POSTS_QUERY_KEY(userId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getUserPostsPageAction(userId, pageParam as string | null),
    getNextPageParam: (last) => last.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
  })
}

export function usePostComments(postId: number, enabled: boolean) {
  return useQuery<FeedComment[]>({
    queryKey: POST_COMMENTS_KEY(postId),
    enabled,
    queryFn: async () => {
      const result = await getPostCommentsAction(postId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    staleTime: 30_000,
  })
}

export function useHomeStats(initialStats: HomeFeedStats) {
  return useQuery<HomeFeedStats>({
    queryKey: HOME_STATS_KEY,
    queryFn: getHomeStatsAction,
    initialData: initialStats,
    staleTime: 30_000,
  })
}
