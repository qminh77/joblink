"use client"

import { useEffect, useMemo } from "react"
import { useQueryClient, type InfiniteData } from "@tanstack/react-query"

import type { FeedPage, FeedPost } from "../types"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  FEED_QUERY_KEY,
  HOME_STATS_KEY,
  POST_COMMENTS_KEY,
} from "./keys"

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

export function useRealtimeEngagement(
  visiblePostIds: number[],
  currentUserId: number | null,
) {
  const qc = useQueryClient()
  // Cap the filter list to prevent string from exceeding Supabase's realtime filter length limit.
  const cappedIds = useMemo(() => {
    const sorted = Array.from(new Set(visiblePostIds)).sort((a, b) => b - a)
    return sorted.slice(0, 50).join(",")
  }, [visiblePostIds])

  useEffect(() => {
    if (!cappedIds) return

    const supabase = createBrowserClient()
    const channel = supabase.channel(`home-feed-engagement`)
    for (const table of [
      "post_reactions",
      "post_comments",
      "post_shares",
      "poll_options",
    ]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `post_id=in.(${cappedIds})`,
        },
        (payload) => {
          const row = (payload.new as Record<string, unknown> | null) ?? (payload.old as Record<string, unknown> | null)
          if (!row || typeof row.post_id !== "number") return
          const postId = row.post_id

          // O(1) Cache Updates for Feed
          qc.setQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY, (oldData) => {
            if (!oldData?.pages) return oldData
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id !== postId) return post

                  const p: FeedPost = { ...post }
                  if (table === "post_reactions") {
                    const reactionUserId =
                      (payload.new as Record<string, unknown> | null)
                        ?.user_id ??
                      (payload.old as Record<string, unknown> | null)
                        ?.user_id
                    const isOwnAction =
                      currentUserId != null &&
                      typeof reactionUserId === "number" &&
                      reactionUserId === currentUserId
                    if (isOwnAction) {
                      if (payload.eventType === "INSERT") p.viewerReacted = true
                      else if (payload.eventType === "DELETE")
                        p.viewerReacted = false
                    } else {
                      if (payload.eventType === "INSERT") p.reactionCount++
                      else if (payload.eventType === "DELETE")
                        p.reactionCount = Math.max(0, p.reactionCount - 1)
                    }
                  } else if (table === "post_comments") {
                    const commentUserId =
                      (payload.new as Record<string, unknown> | null)
                        ?.user_id ??
                      (payload.old as Record<string, unknown> | null)
                        ?.user_id
                    const isOwnComment =
                      currentUserId != null &&
                      typeof commentUserId === "number" &&
                      commentUserId === currentUserId
                    if (!isOwnComment) {
                      if (payload.eventType === "INSERT") p.commentCount++
                      else if (payload.eventType === "DELETE") p.commentCount = Math.max(0, p.commentCount - 1)
                    }
                  } else if (table === "post_shares") {
                    if (payload.eventType === "INSERT") p.shareCount++
                  } else if (table === "poll_options" && payload.eventType === "UPDATE") {
                    if (p.pollOptions && typeof row.id === "number" && typeof row.vote_count === "number") {
                      p.pollOptions = p.pollOptions.map((opt) =>
                        opt.id === row.id
                          ? { ...opt, voteCount: row.vote_count as number }
                          : opt
                      )
                    }
                  }
                  return p
                }),
              })),
            }
          })

          // Invalidate comments query specifically if it's a comment event
          if (table === "post_comments") {
             qc.invalidateQueries({ queryKey: POST_COMMENTS_KEY(postId) })
          }
        },
      )
    }
    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [cappedIds, qc])
}

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
