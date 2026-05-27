"use client"

import { useEffect, useMemo, useRef } from "react"
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
  deleteCommentAction,
  deletePostAction,
  getFeedPageAction,
  getHomeStatsAction,
  getPostCommentsAction,
  getUserPostsPageAction,
  sharePostAction,
  toggleReactionAction,
  updatePostAction,
  voteAction,
} from "../api/actions"
import { buildPollMedia } from "../lib/poll"
import type {
  FeedComment,
  FeedPage,
  FeedPost,
  HomeFeedStats,
  UserPostsPage,
} from "../types"

export const FEED_QUERY_KEY = ["home-feed"] as const
export const HOME_STATS_KEY = ["home", "stats"] as const
export const POST_COMMENTS_KEY = (postId: number) =>
  ["post-comments", postId] as const
export const USER_POSTS_QUERY_KEY = (userId: number) =>
  ["user-posts", userId] as const

type FeedCache = InfiniteData<FeedPage>
type UserPostsCache = InfiniteData<UserPostsPage>

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
      posts: page.posts.map((p) => (p.id === postId ? updater(p) : p)),
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

/**
 * Apply a per-post updater to every cache that contains feed posts:
 * the home feed and any open user-posts caches. Lets reactions/comments/
 * shares stay consistent regardless of where the user interacted with a post.
 */
function applyToAllPostCaches(
  qc: ReturnType<typeof useQueryClient>,
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

function removePostFromAllCaches(
  qc: ReturnType<typeof useQueryClient>,
  postId: number,
) {
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
          posts: page.posts.filter((p) => p.id !== postId),
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

    // Prepend vào user-posts cache của chính tác giả (nếu đang mở profile họ).
    const key = USER_POSTS_QUERY_KEY(post.authorId)
    qc.setQueryData<UserPostsCache>(key, (cache) => {
      if (!cache) return cache
      const [first, ...rest] = cache.pages
      const exists = first?.posts.some((p) => p.id === post.id) ?? false
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

export function useCreatePost() {
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      content: string
      visibility?: "public" | "connections" | "private"
      mediaItems?: { url: string; width?: number; height?: number }[]
      options?: string[]
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

export function useUpdatePost() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      postId: number
      content: string
      visibility: "public" | "connections" | "private"
      mediaItems?: { url: string; width?: number; height?: number }[]
      options?: { id?: number; optionText: string }[]
    }) => {
      const result = await updatePostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (updated) => {
      applyToAllPostCaches(qc, updated.postId, (p) => {
        const upd = updated as Record<string, unknown>
        const newOpts = upd.pollOptions as
          | { id: number; optionText: string; voteCount: number }[]
          | undefined
        return {
          ...p,
          content: updated.content,
          visibility: updated.visibility,
          media: updated.media,
          postType: updated.postType,
          pollOptions: newOpts
            ? newOpts.map((o) => ({
                id: o.id,
                optionText: o.optionText,
                voteCount: o.voteCount,
                viewerVoted: false,
              }))
            : p.pollOptions,
        }
      })
      toast.success(t("updateSuccess"))
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
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })
      applyToAllPostCaches(qc, postId, (p) => ({
        ...p,
        viewerReacted: !p.viewerReacted,
        reactionCount: p.viewerReacted
          ? Math.max(0, p.reactionCount - 1)
          : p.reactionCount + 1,
      }))
      return { previousFeed, previousUserPosts }
    },
    onError: (e: Error, _postId, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(FEED_QUERY_KEY, context.previousFeed)
      }
      if (context?.previousUserPosts) {
        for (const [key, data] of context.previousUserPosts) {
          qc.setQueryData(key, data)
        }
      }
      toast.error(e.message)
    },
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
      return result.data.comment
    },
    onSuccess: (comment) => {
      applyToAllPostCaches(qc, comment.postId, (p) => ({
        ...p,
        commentCount: p.commentCount + 1,
      }))
      qc.setQueryData<FeedComment[]>(
        POST_COMMENTS_KEY(comment.postId),
        (prev) => (prev ? [...prev, comment] : [comment]),
      )
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useVote() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async ({
      postId,
      optionId,
    }: {
      postId: number
      optionId: number
    }) => {
      const result = await voteAction(postId, optionId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onMutate: async ({ postId, optionId }) => {
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })

      applyToAllPostCaches(qc, postId, (p) => {
        if (p.postType !== "poll" || !p.pollOptions) return p

        const updatedPollOptions = p.pollOptions.map((o) => ({
          ...o,
          voteCount: o.id === optionId ? o.voteCount + 1 : o.voteCount,
          viewerVoted: o.id === optionId,
        }))

        const updatedTotalVotes = updatedPollOptions.reduce(
          (sum, o) => sum + o.voteCount,
          0,
        )

        return {
          ...p,
          pollOptions: updatedPollOptions,
          media: buildPollMedia(
            updatedPollOptions.map(({ id, optionText, voteCount }) => ({
              id,
              optionText,
              voteCount,
            })),
            updatedTotalVotes,
          ),
        }
      })

      return { previousFeed, previousUserPosts }
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(FEED_QUERY_KEY, context.previousFeed)
      }
      if (context?.previousUserPosts) {
        for (const [key, data] of context.previousUserPosts) {
          qc.setQueryData(key, data)
        }
      }
      toast.error(e.message)
    },
    onSuccess: () => {
      toast.success(t("voteSuccess"))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: FEED_QUERY_KEY })
      qc.invalidateQueries({ queryKey: ["user-posts"] })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  const t = useTranslations("feed")
  return useMutation({
    mutationFn: async (commentId: number) => {
      const result = await deleteCommentAction(commentId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: ({ commentId, postId }) => {
      qc.setQueryData<FeedComment[]>(POST_COMMENTS_KEY(postId), (prev) =>
        prev ? prev.filter((c) => c.id !== commentId) : prev,
      )
      applyToAllPostCaches(qc, postId, (p) => ({
        ...p,
        commentCount: Math.max(0, p.commentCount - 1),
      }))
      toast.success(t("deleteCommentSuccess"))
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSharePost() {
  const qc = useQueryClient()
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      postId: number
      commentContent?: string | null
    }) => {
      const result = await sharePostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: ({ post }) => {
      // Bump shareCount của post gốc trên tất cả các cache.
      const media = post.media as { originalPostId?: number } | null
      const originalId = media?.originalPostId
      if (typeof originalId === "number") {
        applyToAllPostCaches(qc, originalId, (p) => ({
          ...p,
          shareCount: p.shareCount + 1,
        }))
      }
      // Prepend bài share (1 post thật) vào feed + profile của người chia sẻ.
      prepend(post)
      toast.success(t("shareSuccess"))
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
      // Optimistic: ẩn ngay khỏi feed + user-posts cache. Rollback nếu server fail.
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })
      removePostFromAllCaches(qc, postId)
      return { previousFeed, previousUserPosts }
    },
    onError: (e: Error, _postId, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(FEED_QUERY_KEY, context.previousFeed)
      }
      if (context?.previousUserPosts) {
        for (const [key, data] of context.previousUserPosts) {
          qc.setQueryData(key, data)
        }
      }
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
  const filterKey = useMemo(
    () =>
      Array.from(new Set(allowedAuthorIds))
        .sort((a, b) => a - b)
        .join(","),
    [allowedAuthorIds],
  )
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

/**
 * Subscribe realtime cho engagement (reactions/comments/shares) trên các post
 * đang hiển thị trong feed. Khi có thay đổi, invalidate feed để counters cập
 * nhật từ server.
 *
 * Tối ưu:
 *   • Sort + dedupe filterKey → không re-subscribe khi React Query thêm
 *     page mới với cùng tập post ID hiện hữu.
 *   • Debounce invalidate feed 800ms → gộp nhiều event (vd burst reaction
 *     của nhiều user) thành 1 lần refetch.
 *   • Per-post comments key chỉ invalidate khi ai đó có thread đang mở
 *     (React Query tự skip nếu không có observer enabled).
 */
export function useRealtimeEngagement(visiblePostIds: number[]) {
  const qc = useQueryClient()
  const filterKey = useMemo(
    () => Array.from(new Set(visiblePostIds)).sort((a, b) => a - b).join(","),
    [visiblePostIds],
  )
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!filterKey) return

    const scheduleInvalidate = () => {
      if (pendingTimer.current != null) return
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null
        qc.invalidateQueries({ queryKey: FEED_QUERY_KEY })
      }, 800)
    }

    const supabase = createBrowserClient()
    const channel = supabase.channel(`home-feed-engagement-${filterKey.length}`)
    for (const table of ["post_reactions", "post_comments", "post_shares", "poll_votes"]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `post_id=in.(${filterKey})`,
        },
        (payload) => {
          scheduleInvalidate()
          if (table === "post_comments") {
            const row =
              (payload.new as { post_id?: number } | null) ??
              (payload.old as { post_id?: number } | null)
            if (row?.post_id) {
              qc.invalidateQueries({
                queryKey: POST_COMMENTS_KEY(row.post_id),
              })
            }
          }
        },
      )
    }
    channel.subscribe()

    return () => {
      if (pendingTimer.current != null) {
        clearTimeout(pendingTimer.current)
        pendingTimer.current = null
      }
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
