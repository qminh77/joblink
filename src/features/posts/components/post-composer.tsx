"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { BarChart2, Globe, Image as ImageIcon, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useCreatePost } from "../hooks"

export function PostComposer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const tHome = useTranslations("home")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [content, setContent] = useState("")
  const createPost = useCreatePost()

  async function submit() {
    const text = content.trim()
    if (!text || createPost.isPending) return
    await createPost.mutateAsync({ content: text })
    setContent("")
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="create-post-overlay"
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
            className="w-full max-w-lg bg-card border border-border/40 rounded-[24px] shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <h2 className="font-headline font-bold text-lg">Tạo bài viết</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{user.displayName}</h3>
                  <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 font-medium text-muted-foreground">
                    <Globe className="w-3 h-3" /> Công khai
                  </span>
                </div>
              </div>
              <textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={tHome("composerPlaceholder", {
                  name: user.displayName.split(" ").slice(-1)[0] ?? "",
                })}
                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground/70 outline-none"
              />
            </div>
            <div className="p-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={submit}
                disabled={!content.trim() || createPost.isPending}
                className="px-6 rounded-xl font-semibold"
              >
                {createPost.isPending ? "..." : "Đăng"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
