"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { MessageSquare, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fadeUp, staggerSm } from "@/lib/animations"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useDeleteComment, usePostComments } from "../hooks"

function CommentSkeleton() {
  return (
    <div className="flex gap-2 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
      <div className="flex-1 max-w-[70%]">
        <div className="bg-muted rounded-2xl px-3 py-1.5">
          <div className="h-2 w-20 bg-muted-foreground/20 rounded mb-1.5" />
          <div className="h-2 w-32 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  )
}

export function CommentsThread({
  postId,
  enabled,
}: {
  postId: number
  enabled: boolean
}) {
  const tFeed = useTranslations("feed")
  const user = useCurrentUser()
  const { data: comments, isLoading } = usePostComments(postId, enabled)
  const deleteComment = useDeleteComment()

  if (!enabled) return null

  if (isLoading) {
    return (
      <div className="space-y-2 pt-1">
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    )
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-4 text-center text-muted-foreground">
        <MessageSquare className="w-4 h-4 opacity-60" />
        <p className="text-[11px]">{tFeed("noComments")}</p>
      </div>
    )
  }

  return (
    <motion.ul
      variants={staggerSm}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2 pt-1"
    >
      {comments.map((c) => {
        const isOwn = c.userId === user.id
        const initials = getInitials(c.author.displayName, "JL")
        const pendingDelete =
          deleteComment.isPending && deleteComment.variables === c.id

        return (
          <motion.li
            key={c.id}
            variants={fadeUp}
            className={`flex gap-2 group ${pendingDelete ? "opacity-50" : ""}`}
          >
            <Link
              href={`/profile/${c.userId}`}
              className="shrink-0"
              aria-label={c.author.displayName}
            >
              <Avatar className="w-7 h-7 border border-border/40 hover:opacity-80 transition-opacity">
                {c.author.avatarUrl ? (
                  <AvatarImage src={c.author.avatarUrl} />
                ) : null}
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="inline-block max-w-full bg-muted/70 rounded-2xl px-3 py-1.5">
                <Link
                  href={`/profile/${c.userId}`}
                  className="font-semibold text-[12px] text-foreground hover:text-primary transition-colors leading-tight"
                >
                  {c.author.displayName}
                </Link>
                <p className="text-[12.5px] text-foreground/90 whitespace-pre-line break-words leading-snug mt-0.5">
                  {c.content}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-0.5 ml-3 text-[10.5px] text-muted-foreground">
                <span>{formatRelativeTime(c.createdAt)}</span>
                {isOwn ? (
                  <button
                    type="button"
                    onClick={() => deleteComment.mutate(c.id)}
                    disabled={pendingDelete}
                    aria-label={tFeed("deleteComment")}
                    className="inline-flex items-center gap-1 font-medium hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-100 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{tFeed("deleteComment")}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </motion.li>
        )
      })}
    </motion.ul>
  )
}
