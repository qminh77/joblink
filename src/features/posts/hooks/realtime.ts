"use client"

import { useEffect, useMemo, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

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
    for (const table of [
      "post_reactions",
      "post_comments",
      "post_shares",
      "poll_votes",
    ]) {
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
