"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  Globe,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { btnTap, fadeUp } from "@/lib/animations"
import { formatRelativeTime } from "@/lib/utils/format"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useCreateComment, useToggleReaction } from "../hooks"
import type { FeedPost } from "../types"

type Props = {
  post: FeedPost
  onShare: (post: FeedPost) => void
  onSend: (post: FeedPost) => void
}

function visibilityIcon(v: FeedPost["visibility"]) {
  if (v === "private") return <Lock className="w-3 h-3" />
  if (v === "connections") return <Users className="w-3 h-3" />
  return <Globe className="w-3 h-3" />
}

export function PostCard({ post, onShare, onSend }: Props) {
  const tFeed = useTranslations("feed")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState("")

  const toggle = useToggleReaction()
  const createComment = useCreateComment()

  const authorInitials = getInitials(post.author.displayName, "JL")

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    setComment("")
    createComment.mutate({ postId: post.id, content: text })
  }

  return (
    <motion.div variants={fadeUp}>
      <Card className="bg-card border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.authorId}`}>
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/40 hover:opacity-80 transition-opacity">
                  {post.author.avatarUrl ? (
                    <AvatarImage src={post.author.avatarUrl} />
                  ) : null}
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  href={`/profile/${post.authorId}`}
                  className="font-headline font-bold text-foreground text-[13px] sm:text-sm hover:text-primary transition-colors leading-none mb-1 block"
                >
                  {post.author.displayName}
                </Link>
                {post.author.headline ? (
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-none">
                    {post.author.headline}
                  </p>
                ) : null}
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center mt-1">
                  {formatRelativeTime(post.createdAt)}{" "}
                  <span className="mx-1">•</span>{" "}
                  {visibilityIcon(post.visibility)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 text-[13px] sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-body">
            {post.content}
          </div>
        </div>

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
              onClick={() => setOpen((v) => !v)}
            >
              {tFeed("commentsCount", { count: post.commentCount })}
            </button>
            <button
              type="button"
              className="hover:text-primary transition-colors"
              onClick={() => onShare(post)}
            >
              {tFeed("sharesCount", { count: post.shareCount })}
            </button>
          </div>
        </div>

        <div className="px-1 sm:px-2 py-1 flex items-center justify-between">
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => toggle.mutate(post.id)}
            disabled={toggle.isPending}
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
            onClick={() => setOpen((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("comment")}</span>
          </motion.button>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => onShare(post)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("share")}</span>
          </motion.button>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => onSend(post)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("send")}</span>
          </motion.button>
        </div>

        {open ? (
          <div className="p-4 bg-muted/10 border-t border-border/30">
            <form onSubmit={submitComment} className="flex gap-3">
              <Avatar className="w-8 h-8">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center bg-transparent border border-border/60 rounded-full px-4 bg-card focus-within:border-primary transition-colors">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={tFeed("writeComment")}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] py-2 outline-none"
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || createComment.isPending}
                  className="text-primary disabled:opacity-50 p-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </Card>
    </motion.div>
  )
}
