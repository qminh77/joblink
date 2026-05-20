"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Link as LinkIcon, Share2, X } from "lucide-react"

import { modalContent, modalOverlay } from "@/lib/animations"

export function ShareModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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
              <h2 className="font-headline font-bold text-lg">Chia sẻ bài viết</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left"
              >
                <div className="p-2 bg-primary/10 text-primary rounded-full">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Chia sẻ lên Feed</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Chia sẻ ngay trên trang cá nhân của bạn
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left"
              >
                <div className="p-2 bg-muted text-foreground rounded-full">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Sao chép liên kết</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Sao chép URL bài viết để gửi
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
