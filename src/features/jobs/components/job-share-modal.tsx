"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Link as LinkIcon, Share2, X } from "lucide-react"
import { toast } from "sonner"

import { modalContent, modalOverlay } from "@/lib/animations"
import { useCreatePost } from "@/features/posts/hooks/mutations"
import type { SharedJobPreview } from "@/features/posts/types"

export function JobShareModal({
  job,
  open,
  onClose,
}: {
  job: SharedJobPreview
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <JobShareModalInner key={job.id} job={job} onClose={onClose} />
  )
}

function JobShareModalInner({
  job,
  onClose,
}: {
  job: SharedJobPreview
  onClose: () => void
}) {
  const tPosts = useTranslations("posts")
  const createPost = useCreatePost()
  const [comment, setComment] = useState("")

  async function handleShareToFeed() {
    if (createPost.isPending) return
    await createPost.mutateAsync({ content: comment.trim(), sharedJob: job })
    onClose()
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/jobs/${job.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(tPosts("copyLinkSuccess"))
    } catch {
      toast.error(tPosts("copyLinkError"))
    }
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="share-overlay"
        variants={modalOverlay}
        initial="hidden"
        animate="show"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="show"
          exit="exit"
          className="w-full max-w-sm bg-card border border-border/40 rounded-[24px] shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <h2 className="font-headline font-bold text-lg">
              {tPosts("shareTitle")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={tPosts("shareCommentPlaceholder")}
              rows={2}
              className="w-full text-sm bg-muted/40 border border-border/40 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={createPost.isPending}
            />
          </div>

          <div className="p-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleShareToFeed}
              disabled={createPost.isPending}
              className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2 bg-primary/10 text-primary rounded-full">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  {tPosts("shareToFeed")}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {createPost.isPending
                    ? tPosts("shareSubmitting")
                    : tPosts("shareToFeedHint")}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-muted text-foreground rounded-full">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">
                  {tPosts("copyLink")}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {tPosts("copyLinkHint")}
                </p>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
