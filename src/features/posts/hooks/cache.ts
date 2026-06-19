"use client"

import { useQueryClient, type InfiniteData } from "@tanstack/react-query"

import type { FeedPage, FeedPost, UserPostsPage } from "../types"
import { FEED_QUERY_KEY, USER_POSTS_QUERY_KEY } from "./keys"

export type FeedCache = InfiniteData<FeedPage>
export type UserPostsCache = InfiniteData<UserPostsPage>

type PostsQueryClient = ReturnType<typeof useQueryClient>

function mapCachePosts<T extends { posts: FeedPost[] }>(
  cache: InfiniteData<T> | undefined,
  postId: number,
  updater: (post: FeedPost) => FeedPost,
): InfiniteData<T> | undefined {
  if (!cache) return cache
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      posts: page.posts.map((post) =>
        post.id === postId ? updater(post) : post,
      ),
    })),
  }
}

function applyToPost(
  cache: FeedCache | undefined,
  postId: number,
  updater: (post: FeedPost) => FeedPost,
): FeedCache | undefined {
  return mapCachePosts(cache, postId, updater)
}

export function applyToAllPostCaches(
  qc: PostsQueryClient,
  postId: number,
  updater: (post: FeedPost) => FeedPost,
) {
  qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) =>
    applyToPost(cache, postId, updater),
  )
  const userPostsQueries = qc.getQueriesData<UserPostsCache>({
    queryKey: ["user-posts"],
  })
  for (const [key] of userPostsQueries) {
    qc.setQueryData<UserPostsCache>(key, (cache) =>
      mapCachePosts(cache, postId, updater),
    )
  }
}

export function removePostFromAllCaches(qc: PostsQueryClient, postId: number) {
  qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) => {
    if (!cache) return cache
    return {
      ...cache,
      pages: cache.pages.map((page) => ({
        ...page,
        posts: page.posts.filter((post) => post.id !== postId),
      })),
    }
  })

  const userPostsQueries = qc.getQueriesData<UserPostsCache>({
    queryKey: ["user-posts"],
  })
  for (const [key] of userPostsQueries) {
    qc.setQueryData<UserPostsCache>(key, (cache) => {
      if (!cache) return cache
      return {
        ...cache,
        pages: cache.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((post) => post.id !== postId),
        })),
      }
    })
  }
}

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
