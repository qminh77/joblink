"use client"

import { CommentInput } from "../comment-input"
import { CommentsThread } from "../comments-thread"

export function PostCommentsSection({
  enabled,
  isSubmitting,
  onSubmit,
  postId,
}: {
  enabled: boolean
  isSubmitting: boolean
  onSubmit: (text: string) => void
  postId: number
}) {
  if (!enabled) return null

  return (
    <div className="p-4 bg-muted/10 border-t border-border/30 space-y-3">
      <CommentInput isSubmitting={isSubmitting} onSubmit={onSubmit} />
      <CommentsThread postId={postId} enabled={enabled} />
    </div>
  )
}
