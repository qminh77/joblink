"use client"

import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { MessageCircle, Send, Share2, ThumbsUp } from "lucide-react"

import { btnTap } from "@/lib/animations"

import type { FeedPost } from "../../types"

export function PostActionsBar({
  onComment,
  onLike,
  onSend,
  onShare,
  post,
  togglePending,
}: {
  onComment: () => void
  onLike: () => void
  onSend: () => void
  onShare: () => void
  post: FeedPost
  togglePending: boolean
}) {
  const tFeed = useTranslations("feed")

  return (
    <div className="px-1 sm:px-2 py-1 flex items-center justify-between">
      <motion.button
        {...btnTap}
        type="button"
        onClick={onLike}
        disabled={togglePending}
        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] ${
          post.viewerReacted
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <ThumbsUp
          className={`w-4 h-4 ${post.viewerReacted ? "fill-primary" : ""}`}
        />
        <span className="hidden sm:inline">{tFeed("like")}</span>
      </motion.button>
      <motion.button
        {...btnTap}
        type="button"
        onClick={onComment}
        className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">{tFeed("comment")}</span>
      </motion.button>
      <motion.button
        {...btnTap}
        type="button"
        onClick={onShare}
        className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">{tFeed("share")}</span>
      </motion.button>
      <motion.button
        {...btnTap}
        type="button"
        onClick={onSend}
        className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
      >
        <Send className="w-4 h-4" />
        <span className="hidden sm:inline">{tFeed("send")}</span>
      </motion.button>
    </div>
  )
}
