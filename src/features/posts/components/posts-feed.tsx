"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { staggerSm } from "@/lib/animations"

import { useHomeFeed, useRealtimeFeed } from "../hooks"
import type { FeedPage, FeedPost } from "../types"

import { PostCard } from "./post-card"
import { SendModal } from "./send-modal"
import { ShareModal } from "./share-modal"
import type { NetworkUserCard } from "@/features/network/types"

type Props = {
  initialPage: FeedPage
  contacts: NetworkUserCard[]
  realtimeAuthorIds: number[]
}

export function PostsFeed({ initialPage, contacts, realtimeAuthorIds }: Props) {
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

  const posts = data?.pages.flatMap((p) => p.posts) ?? []

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
            Chưa có bài viết nào trong bảng tin của bạn.
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
              Đang tải thêm...
            </span>
          ) : !hasNextPage && posts.length > 0 ? (
            <span className="text-xs text-muted-foreground">Hết bài viết</span>
          ) : null}
        </div>
      </motion.div>

      <ShareModal
        open={shareTarget != null}
        onClose={() => setShareTarget(null)}
      />
      <SendModal
        open={sendTarget != null}
        onClose={() => setSendTarget(null)}
        contacts={contacts}
      />
    </>
  )
}
