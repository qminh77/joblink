"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { MessageSquare, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { fadeUp, staggerSm } from "@/lib/animations"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import type { FeedComment } from "../types"
import { useCreateComment, useDeleteComment, usePostComments } from "../hooks"

import { CommentBody } from "./comment-body"
import { CommentInput, type ReplyTarget } from "./comment-input"

type CommentNode = FeedComment & { replies: FeedComment[] }

// Group flat list thành tree depth 2:
//   - Top-level: comment có parent_id = null.
//   - Reply: tất cả comment có parent_id ≠ null → gắn vào root (đi lên qua chain).
// Cách này khớp UX Facebook: không nest sâu, reply-của-reply hiển thị
// cùng cấp với reply gốc.
function buildTree(comments: FeedComment[]): CommentNode[] {
  const byId = new Map<number, FeedComment>()
  for (const c of comments) byId.set(c.id, c)

  const rootById = new Map<number, CommentNode>()
  const replies: FeedComment[] = []

  for (const c of comments) {
    if (c.parentId == null) {
      rootById.set(c.id, { ...c, replies: [] })
    } else {
      replies.push(c)
    }
  }

  // Tìm root tổ tiên cho mỗi reply (đi lên parent chain, tối đa vài bước).
  for (const r of replies) {
    let cursor: number | null = r.parentId
    let guard = 8
    while (cursor != null && guard-- > 0) {
      const root = rootById.get(cursor)
      if (root) {
        root.replies.push(r)
        break
      }
      cursor = byId.get(cursor)?.parentId ?? null
    }
  }

  return Array.from(rootById.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

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

  const tree = useMemo(() => buildTree(comments ?? []), [comments])

  if (!enabled) return null

  if (isLoading) {
    return (
      <div className="space-y-2 pt-1">
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    )
  }

  if (tree.length === 0) {
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
      {tree.map((node) => (
        <CommentBranch
          key={node.id}
          node={node}
          postId={postId}
          currentUserId={user.id}
        />
      ))}
    </motion.ul>
  )
}

function CommentBranch({
  node,
  postId,
  currentUserId,
}: {
  node: CommentNode
  postId: number
  currentUserId: number
}) {
  const [replying, setReplying] = useState(false)
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null)
  const createComment = useCreateComment()

  function openReply(target: FeedComment) {
    // Không mention chính mình.
    setReplyTo(
      target.userId === currentUserId
        ? null
        : { userId: target.userId, displayName: target.author.displayName },
    )
    setReplying(true)
  }

  function closeReply() {
    setReplying(false)
    setReplyTo(null)
  }

  return (
    <motion.li variants={fadeUp} className="flex flex-col gap-1.5">
      <CommentRow
        comment={node}
        currentUserId={currentUserId}
        onReply={() => openReply(node)}
      />

      {node.replies.length > 0 ? (
        <ul className="ml-9 flex flex-col gap-1.5 border-l border-border/40 pl-3">
          {node.replies
            .slice()
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            )
            .map((r) => (
              <li key={r.id}>
                <CommentRow
                  comment={r}
                  currentUserId={currentUserId}
                  onReply={() => openReply(r)}
                  compact
                />
              </li>
            ))}
        </ul>
      ) : null}

      {replying ? (
        <div className="ml-9 mt-1">
          <CommentInput
            autoFocus
            compact
            replyTo={replyTo ?? undefined}
            isSubmitting={createComment.isPending}
            onCancel={closeReply}
            onSubmit={(content) => {
              createComment.mutate(
                { postId, content, parentId: node.id },
                { onSuccess: closeReply },
              )
            }}
          />
        </div>
      ) : null}
    </motion.li>
  )
}

function CommentRow({
  comment,
  currentUserId,
  onReply,
  compact = false,
}: {
  comment: FeedComment
  currentUserId: number
  onReply: () => void
  compact?: boolean
}) {
  const tFeed = useTranslations("feed")
  const deleteComment = useDeleteComment()
  const isOwn = comment.userId === currentUserId
  const initials = getInitials(comment.author.displayName, "JL")
  const pendingDelete =
    deleteComment.isPending && deleteComment.variables === comment.id
  const avatarSize = compact ? "w-6 h-6" : "w-7 h-7"

  return (
    <div className={`flex gap-2 group ${pendingDelete ? "opacity-50" : ""}`}>
      <Link
        href={`/profile/${comment.userId}`}
        className="shrink-0"
        aria-label={comment.author.displayName}
      >
        <Avatar className={`${avatarSize} border border-border/40 hover:opacity-80 transition-opacity`}>
          {comment.author.avatarUrl ? (
            <AvatarImage src={comment.author.avatarUrl} />
          ) : null}
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="inline-block max-w-full bg-muted/70 rounded-2xl px-3 py-1.5">
          <Link
            href={`/profile/${comment.userId}`}
            className="font-semibold text-[12px] text-foreground hover:text-primary transition-colors leading-tight"
          >
            {comment.author.displayName}
          </Link>
          <CommentBody content={comment.content} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 ml-3 text-[10.5px] text-muted-foreground">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          <button
            type="button"
            onClick={onReply}
            className="font-medium hover:text-primary transition-colors"
          >
            {tFeed("reply")}
          </button>
          {isOwn ? (
            <button
              type="button"
              onClick={() => deleteComment.mutate(comment.id)}
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
    </div>
  )
}
