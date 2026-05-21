"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import type { NetworkUserCard } from "@/features/network/types"

export function SendModal({
  open,
  onClose,
  contacts,
}: {
  open: boolean
  onClose: () => void
  contacts: NetworkUserCard[]
}) {
  const tPosts = useTranslations("posts")
  const tFeed = useTranslations("feed")

  function handleSend() {
    toast.info(tPosts("sendComingSoon"))
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="send-overlay"
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
                {tPosts("sendViaMessage")}
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
            <div className="p-4 border-b border-border/40">
              <input
                type="text"
                placeholder={tPosts("searchPersonPlaceholder")}
                className="w-full bg-muted border border-border/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="p-2 max-h-60 overflow-y-auto">
              {contacts.map((connection) => (
                <div
                  key={connection.userId}
                  className="flex items-center justify-between p-2 hover:bg-muted rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      {connection.avatarUrl ? (
                        <AvatarImage src={connection.avatarUrl} />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(connection.displayName, "JL")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold">
                      {connection.displayName}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg"
                    onClick={handleSend}
                  >
                    {tFeed("send")}
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
