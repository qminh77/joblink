"use client"

import { useTranslations } from "next-intl"
import { ThumbsUp } from "lucide-react"

import type { FeedPost } from "../../types"

export function PostEngagementSummary({
  onCommentsClick,
  onShareClick,
  post,
}: {
  onCommentsClick: () => void
  onShareClick: () => void
  post: FeedPost
}) {
  const tFeed = useTranslations("feed")

  return (
    <div className="px-3 sm:px-4 py-3 border-b border-t border-border/30 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <div className="bg-blue-500 rounded-full p-0.5 flex items-center justify-center">
          <ThumbsUp className="w-3 h-3 text-white fill-white" />
        </div>
        <span className="ml-1 text-foreground/80 font-medium">
          {post.reactionCount}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="hover:text-primary transition-colors"
          onClick={onCommentsClick}
        >
          {tFeed("commentsCount", { count: post.commentCount })}
        </button>
        <button
          type="button"
          className="hover:text-primary transition-colors"
          onClick={onShareClick}
        >
          {tFeed("sharesCount", { count: post.shareCount })}
        </button>
      </div>
    </div>
  )
}
