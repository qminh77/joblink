"use client"

import { useQueryClient, type InfiniteData } from "@tanstack/react-query"

import type { FeedPage, FeedPost, UserPostsPage } from "../types"
import { FEED_QUERY_KEY, USER_POSTS_QUERY_KEY } from "./keys"

export type FeedCache = InfiniteData<FeedPage>
export type UserPostsCache = InfiniteData<UserPostsPage>

type PostsQueryClient = ReturnType<typeof useQueryClient>

// ── Generic helper: áp dụng biến đổi lên posts trong mọi cache ──────────────

/**
 * Thu thập tất cả query keys liên quan đến posts (feed + user-posts).
 */
function collectPostCacheKeys(qc: PostsQueryClient): unknown[][] {
  const keys: unknown[][] = [[FEED_QUERY_KEY]]
  const userPostsQueries = qc.getQueriesData<unknown[][]>({
    queryKey: ["user-posts"],
  })
  for (const [key] of userPostsQueries) {
    keys.push(key as unknown[])
  }
  return keys
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Áp dụng biến đổi lên 1 post trong TẤT CẢ cache (feed + user-posts).
 */
export function applyToAllPostCaches(
  qc: PostsQueryClient,
  postId: number,
  updater: (post: FeedPost) => FeedPost,
) {
  for (const key of collectPostCacheKeys(qc)) {
    qc.setQueryData(key, (cache: FeedCache | UserPostsCache | undefined) => {
      if (!cache) return cache
      return {
        ...cache,
        pages: cache.pages.map((page: FeedPage | UserPostsPage) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === postId ? updater(post) : post,
          ),
        })),
      }
    })
  }
}

/**
 * Xoá 1 post khỏi TẤT CẢ cache (feed + user-posts).
 */
export function removePostFromAllCaches(qc: PostsQueryClient, postId: number) {
  for (const key of collectPostCacheKeys(qc)) {
    qc.setQueryData(key, (cache: FeedCache | UserPostsCache | undefined) => {
      if (!cache) return cache
      return {
        ...cache,
        pages: cache.pages.map((page: FeedPage | UserPostsPage) => ({
          ...page,
          posts: page.posts.filter((post) => post.id !== postId),
        })),
      }
    })
  }
}

/**
 * Thêm 1 post mới vào đầu feed cache + user-posts cache.
 */
export function usePrependPost() {
  const qc = useQueryClient()
  return (post: FeedPost) => {
    qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) => {
      if (!cache) {
        return {
          pages: [{ posts: [post], jobs: [], nextCursor: null }],
          pageParams: [null],
        }
      }
      const [first, ...rest] = cache.pages
      const exists = first?.posts.some((item) => item.id === post.id) ?? false
      if (exists) return cache
      const updatedFirst: FeedPage = {
        posts: [post, ...(first?.posts ?? [])],
        jobs: first?.jobs ?? [],
        nextCursor: first?.nextCursor ?? null,
      }
      return { ...cache, pages: [updatedFirst, ...rest] }
    })

    const key = USER_POSTS_QUERY_KEY(post.authorId)
    qc.setQueryData<UserPostsCache>(key, (cache) => {
      if (!cache) return cache
      const [first, ...rest] = cache.pages
      const exists = first?.posts.some((item) => item.id === post.id) ?? false
      if (exists) return cache
      const updatedFirst: UserPostsPage = {
        posts: [post, ...(first?.posts ?? [])],
        nextCursor: first?.nextCursor ?? null,
        canView: first?.canView ?? true,
      }
      return { ...cache, pages: [updatedFirst, ...rest] }
    })
  }
}
