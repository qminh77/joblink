"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { BarChart2, Globe, Image as ImageIcon, Lock, Users, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useCreatePost, useUpdatePost } from "../hooks"
import type { FeedPost } from "../types"

type Visibility = "public" | "connections" | "private"

const VISIBILITY_OPTIONS: { value: Visibility; icon: typeof Globe }[] = [
  { value: "public", icon: Globe },
  { value: "connections", icon: Users },
  { value: "private", icon: Lock },
]

export function PostComposer({
  open,
  onClose,
  post,
}: {
  open: boolean
  onClose: () => void
  post?: FeedPost | null
}) {
  const tHome = useTranslations("home")
  const tPosts = useTranslations("posts")
  const tVis = useTranslations("posts.visibility")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const isEdit = post != null

  const [content, setContent] = useState(post?.content ?? "")
  const [visibility, setVisibility] = useState<Visibility>(
    post?.visibility ?? "public",
  )

  // Reset state khi mở/đổi target — tránh giữ lại nội dung của lần trước.
  useEffect(() => {
    if (open) {
      setContent(post?.content ?? "")
      setVisibility(post?.visibility ?? "public")
    }
  }, [open, post])

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const mutation = isEdit ? updatePost : createPost
  const isPending = mutation.isPending

  async function submit() {
    const text = content.trim()
    if (!text || isPending) return
    if (isEdit && post) {
      const unchanged =
        text === post.content && visibility === post.visibility
      if (unchanged) {
        onClose()
        return
      }
      await updatePost.mutateAsync({
        postId: post.id,
        content: text,
        visibility,
      })
    } else {
      await createPost.mutateAsync({ content: text, visibility })
    }
    setContent("")
    setVisibility("public")
    onClose()
  }

  const currentVisIcon =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.icon ?? Globe

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
            className="w-full max-w-lg bg-card rounded-[24px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <h2 className="font-headline font-bold text-lg">
                {isEdit ? tPosts("editTitle") : tPosts("createTitle")}
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
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-10 h-10">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{user.displayName}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="text-[11px] bg-muted px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {(() => {
                          const Icon = currentVisIcon
                          return <Icon className="w-3 h-3" />
                        })()}
                        <span>{tVis(visibility)}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {VISIBILITY_OPTIONS.map(({ value, icon: Icon }) => (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => setVisibility(value)}
                          className="cursor-pointer"
                        >
                          <Icon className="w-4 h-4 mr-2 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {tVis(value)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {tVis(`${value}Hint`)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                  aria-label={tHome("photoVideo")}
                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label={tHome("poll")}
                  className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={submit}
                disabled={!content.trim() || isPending}
                className="px-6 rounded-xl font-semibold"
              >
                {isPending
                  ? isEdit
                    ? tPosts("updating")
                    : tPosts("publishing")
                  : isEdit
                    ? tPosts("save")
                    : tPosts("publish")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
