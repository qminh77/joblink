"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

import { staggerSm } from "@/lib/animations"

import { useHomeFeed, useRealtimeEngagement, useRealtimeFeed } from "../hooks"
import type { FeedPage, FeedPost } from "../types"

import { PostCard } from "./post-card"
import { SendModal } from "./send-modal"
import { ShareModal } from "./share-modal"

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
  useRealtimeEngagement(visiblePostIds)

  return (
    <>
      <motion.div
        variants={staggerSm}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {posts.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            {tFeed("emptyFeed")}
          </div>
        ) : null}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onShare={setShareTarget}
            onSend={setSendTarget}
          />
        ))}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {isFetchingNextPage ? (
            <span className="text-xs text-muted-foreground">
              {tFeed("loadingMore")}
            </span>
          ) : !hasNextPage && posts.length > 0 ? (
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
