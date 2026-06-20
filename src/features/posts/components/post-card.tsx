"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { ImageLightbox } from "@/components/ui/image-lightbox"
import { Card } from "@/components/ui/card"
import { fadeUp } from "@/lib/animations"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { ReportDialog } from "@/features/reports/components/report-dialog"

import type { MediaItem } from "../lib/media"
import { useCreateComment, useDeletePost, useToggleReaction } from "../hooks"
import type { FeedPost } from "../types"
import { PostComposer } from "./post-composer"
import { PostActionsBar } from "./post-card/post-actions-bar"
import { PostCardBody } from "./post-card/post-card-body"
import { PostCardHeader } from "./post-card/post-card-header"
import { PostCommentsSection } from "./post-card/post-comments-section"
import { PostDeleteDialog } from "./post-card/post-delete-dialog"
import { PostEngagementSummary } from "./post-card/post-engagement-summary"

type Props = {
  post: FeedPost
  onShare: (post: FeedPost) => void
  onSend: (post: FeedPost) => void
}

export function PostCard({ post, onShare, onSend }: Props) {
  const user = useCurrentUser()

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [lightbox, setLightbox] = useState<{
    items: MediaItem[]
    index: number
  } | null>(null)

  const toggleReaction = useToggleReaction()
  const createComment = useCreateComment()
  const deletePost = useDeletePost()

  const isOwnPost = user.id === post.authorId
  const toggleComments = () => setCommentsOpen((open) => !open)
  const sharePost = () => onShare(post)
  const sendPost = () => onSend(post)

  return (
    <motion.div variants={fadeUp}>
      <Card className="bg-card border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
        <div className="p-4 pb-3">
          <PostCardHeader
            deletePending={deletePost.isPending}
            isOwnPost={isOwnPost}
            onDelete={() => setShowDelete(true)}
            onEdit={() => setShowEdit(true)}
            onReport={() => setShowReport(true)}
            post={post}
          />
          <PostCardBody
            onOpenLightbox={(items, index) => setLightbox({ items, index })}
            post={post}
          />
        </div>

        <PostEngagementSummary
          onCommentsClick={toggleComments}
          onShareClick={sharePost}
          post={post}
        />

        <PostActionsBar
          onComment={toggleComments}
          onLike={() => toggleReaction.mutate(post.id)}
          onSend={sendPost}
          onShare={sharePost}
          post={post}
        />

        <PostCommentsSection
          enabled={commentsOpen}
          isSubmitting={createComment.isPending}
          onSubmit={(text) =>
            createComment.mutate({ postId: post.id, content: text })
          }
          postId={post.id}
        />
      </Card>

      <PostComposer
        open={showEdit}
        onClose={() => setShowEdit(false)}
        post={post}
      />

      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post.id}
      />

      <PostDeleteDialog
        deleting={deletePost.isPending}
        onConfirm={() => {
          deletePost.mutate(post.id)
          setShowDelete(false)
        }}
        onOpenChange={setShowDelete}
        open={showDelete}
      />

      {lightbox ? (
        <ImageLightbox
          items={lightbox.items}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </motion.div>
  )
}
