"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Lock } from "lucide-react"

import { Card } from "@/components/ui/card"
import { fadeUp, staggerSm } from "@/lib/animations"
import { HomeComposerTrigger } from "@/features/posts/components/home-composer-trigger"
import { PostCard } from "@/features/posts/components/post-card"
import { SendModal } from "@/features/posts/components/send-modal"
import { ShareModal } from "@/features/posts/components/share-modal"
import { useUserPosts } from "@/features/posts/hooks"
import type { FeedPost, UserPostsPage } from "@/features/posts/types"

type Props = {
  targetUserId: number
  isOwner: boolean
  initialPage: UserPostsPage
}

export function ProfilePostsSection({
  targetUserId,
  isOwner,
  initialPage,
}: Props) {
  const tFeed = useTranslations("feed")
  const tProfile = useTranslations("profile")

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserPosts(
    targetUserId,
    initialPage,
  )

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

  const canView = data?.pages[0]?.canView ?? initialPage.canView

  if (!canView) {
    return (
      <Card className="rounded-2xl border-border/40 p-6 text-center">
        <Lock className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {tProfile("posts.lockedHint")}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isOwner ? <HomeComposerTrigger /> : null}

      <h2 className="font-headline font-bold text-base text-foreground px-1">
        {tProfile("posts.heading")}
      </h2>

      {posts.length === 0 ? (
        <Card className="rounded-2xl border-border/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? tProfile("posts.emptyOwn")
              : tProfile("posts.emptyOther")}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={staggerSm}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={fadeUp}>
              <PostCard
                post={post}
                onShare={setShareTarget}
                onSend={setSendTarget}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

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

      <ShareModal post={shareTarget} onClose={() => setShareTarget(null)} />
      <SendModal post={sendTarget} onClose={() => setSendTarget(null)} />
    </div>
  )
}
