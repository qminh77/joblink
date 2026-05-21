"use client"

import { useEffect } from "react"
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"
import {
  createCommentAction,
  createPostAction,
  deletePostAction,
  getFeedPageAction,
  getHomeStatsAction,
  toggleReactionAction,
} from "../api/actions"
import type { FeedPage, FeedPost, HomeFeedStats } from "../types"

export const FEED_QUERY_KEY = ["home-feed"] as const
export const HOME_STATS_KEY = ["home", "stats"] as const

type FeedCache = InfiniteData<FeedPage>

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

function applyToPost(
  cache: FeedCache | undefined,
  postId: number,
  updater: (post: FeedPost) => FeedPost,
): FeedCache | undefined {
  if (!cache) return cache
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      posts: page.posts.map((p) => (p.id === postId ? updater(p) : p)),
    })),
  }
}

export function usePrependPost() {
  const qc = useQueryClient()
  return (post: FeedPost) => {
    qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) => {
      if (!cache) {
        return {
          pages: [{ posts: [post], nextCursor: null }],
          pageParams: [null],
        }
      }
      const [first, ...rest] = cache.pages
      const exists = first?.posts.some((p) => p.id === post.id) ?? false
      if (exists) return cache
      const updatedFirst: FeedPage = {
        posts: [post, ...(first?.posts ?? [])],
        nextCursor: first?.nextCursor ?? null,
      }
      return { ...cache, pages: [updatedFirst, ...rest] }
    })
  }
}

export function useCreatePost() {
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      content: string
      visibility?: "public" | "connections" | "private"
    }) => {
      const result = await createPostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (post) => {
      prepend(post)
      toast.success(t("createSuccess"))
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleReaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (postId: number) => {
      const result = await toggleReactionAction(postId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      const previous = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) =>
        applyToPost(cache, postId, (p) => ({
          ...p,
          viewerReacted: !p.viewerReacted,
          reactionCount: p.viewerReacted
            ? Math.max(0, p.reactionCount - 1)
            : p.reactionCount + 1,
        })),
      )
      return { previous }
    },
    onError: (e: Error, _postId, context) => {
      if (context?.previous) qc.setQueryData(FEED_QUERY_KEY, context.previous)
      toast.error(e.message)
    },
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      postId: number
      content: string
      parentId?: number | null
    }) => {
      const result = await createCommentAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (_data, variables) => {
      qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) =>
        applyToPost(cache, variables.postId, (p) => ({
          ...p,
          commentCount: p.commentCount + 1,
        })),
      )
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (postId: number) => {
      const result = await deletePostAction(postId)
      if (!result.ok) throw new Error(result.error)
      return postId
    },
    onMutate: async (postId) => {
      // Optimistic: ẩn ngay khỏi feed cache. Rollback nếu server fail.
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      const previous = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      qc.setQueryData<FeedCache>(FEED_QUERY_KEY, (cache) => {
        if (!cache) return cache
        return {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== postId),
          })),
        }
      })
      return { previous }
    },
    onError: (e: Error, _postId, context) => {
      if (context?.previous) qc.setQueryData(FEED_QUERY_KEY, context.previous)
      toast.error(e.message)
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
    },
  })
}

/**
 * Subscribe realtime cho posts của tác giả đã follow / tự mình.
 * Khi có INSERT mới của tác giả thuộc allowedAuthorIds, invalidate query để
 * server stream lại bài mới — đơn giản, không cần build full payload ở client.
 */
export function useRealtimeFeed(allowedAuthorIds: number[]) {
  const qc = useQueryClient()
  const filterKey = allowedAuthorIds.join(",")
  useEffect(() => {
    if (!filterKey) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel("home-feed-posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `author_id=in.(${filterKey})`,
        },
        () => {
          qc.invalidateQueries({ queryKey: FEED_QUERY_KEY })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [filterKey, qc])
}

export function useHomeStats(initialStats: HomeFeedStats) {
  return useQuery<HomeFeedStats>({
    queryKey: HOME_STATS_KEY,
    queryFn: getHomeStatsAction,
    initialData: initialStats,
    staleTime: 30_000,
  })
}

/**
 * Đồng bộ counter cache (connection_count, profile_view_count) realtime:
 *   • connections — INSERT/UPDATE/DELETE liên quan tới me → connection_count đổi
 *   • profile_view_logs — INSERT target=me → profile_view_count tăng
 * Cả hai đều invalidate cùng 1 query key, gọn và đúng nguồn dữ liệu.
 */
export function useRealtimeHomeStats(currentUserId: number | null) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!currentUserId) return
    const supabase = createBrowserClient()
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: HOME_STATS_KEY })
    }
    const channel = supabase
      .channel(`home-stats-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `requester_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profile_view_logs",
          filter: `target_user_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, qc])
}
