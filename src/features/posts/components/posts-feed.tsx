"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

import { staggerSm } from "@/lib/animations"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useHomeFeed, useRealtimeEngagement, useRealtimeFeed } from "../hooks"
import type { FeedJob, FeedPage, FeedPost } from "../types"

import { JobFeedCard } from "./job-feed-card"
import { PostCard } from "./post-card"
import { SendModal } from "./send-modal"
import { ShareModal } from "./share-modal"

// Item hiển thị trong feed: post (mạng xã hội) hoặc job (tin tuyển dụng công ty),
// trộn theo created_at giảm dần.
type FeedRenderItem =
  | { kind: "post"; createdAt: string; post: FeedPost }
  | { kind: "job"; createdAt: string; job: FeedJob }

type Props = {
  initialPage: FeedPage
  realtimeAuthorIds: number[]
}

export function PostsFeed({ initialPage, realtimeAuthorIds }: Props) {
  const tFeed = useTranslations("feed")
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHomeFeed(initialPage)

  useRealtimeFeed(realtimeAuthorIds)

  const [shareTarget, setShareTarget] = useState<FeedPost | null>(null)
  const [sendTarget, setSendTarget] = useState<FeedPost | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage()
          }
        }
      },
      { rootMargin: "400px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = useMemo(
    () => data?.pages.flatMap((p) => p.posts) ?? [],
    [data],
  )
  const visiblePostIds = useMemo(() => posts.map((p) => p.id), [posts])
  const user = useCurrentUser()
  useRealtimeEngagement(visiblePostIds, user.id)

  // Trộn posts + jobs từ mọi trang, sort theo created_at giảm dần. Cursor phía
  // server đã thống nhất nên thứ tự không lệch ở ranh giới trang.
  const items = useMemo<FeedRenderItem[]>(() => {
    const merged: FeedRenderItem[] = []
    for (const page of data?.pages ?? []) {
      for (const post of page.posts) {
        merged.push({ kind: "post", createdAt: post.createdAt, post })
      }
      for (const job of page.jobs ?? []) {
        merged.push({ kind: "job", createdAt: job.createdAt, job })
      }
    }
    merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return merged
  }, [data])

  return (
    <>
      <motion.div
        variants={staggerSm}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            {tFeed("emptyFeed")}
          </div>
        ) : null}

        {items.map((item) =>
          item.kind === "post" ? (
            <PostCard
              key={`post-${item.post.id}`}
              post={item.post}
              onShare={setShareTarget}
              onSend={setSendTarget}
            />
          ) : (
            <JobFeedCard key={`job-${item.job.id}`} job={item.job} />
          ),
        )}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage ? (
            <span className="text-xs text-muted-foreground">
              {tFeed("loadingMore")}
            </span>
          ) : !hasNextPage && items.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {tFeed("endOfFeed")}
            </span>
          ) : null}
        </div>
      </motion.div>

      <ShareModal post={shareTarget} onClose={() => setShareTarget(null)} />
      <SendModal post={sendTarget} onClose={() => setSendTarget(null)} />
    </>
  )
}
