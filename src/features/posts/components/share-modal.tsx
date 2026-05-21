"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Link as LinkIcon, Share2, X } from "lucide-react"
import { toast } from "sonner"

import { modalContent, modalOverlay } from "@/lib/animations"

import { useSharePost } from "../hooks"
import type { FeedPost } from "../types"

export function ShareModal({
  post,
  onClose,
}: {
  post: FeedPost | null
  onClose: () => void
}) {
  const tPosts = useTranslations("posts")
  const share = useSharePost()
  const open = post != null

  async function handleShareToFeed() {
    if (!post || share.isPending) return
    await share.mutateAsync({ postId: post.id })
    onClose()
  }

  async function handleCopyLink() {
    if (!post) return
    const url = `${window.location.origin}/posts/${post.id}`
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
      {open ? (
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
                aria-label={tPosts("deleteDialog.cancel")}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={handleShareToFeed}
                disabled={share.isPending}
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
                    {share.isPending
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
      ) : null}
    </AnimatePresence>
  )
}
