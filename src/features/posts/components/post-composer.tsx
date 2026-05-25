"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { BarChart2, Globe, Image as ImageIcon, Loader2, Lock, Users, X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/ui/error-alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  POST_IMAGE_ALLOWED_TYPES,
  POST_IMAGE_MAX_BYTES,
  PostImageError,
  validatePostImage,
  type PostImageErrorCode,
} from "../api/storage-client"
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Reset state khi mở/đổi target — tránh giữ lại nội dung của lần trước.
  useEffect(() => {
    if (open) {
      setContent(post?.content ?? "")
      setVisibility(post?.visibility ?? "public")
      setImageFile(null)
      setImagePreview(null)
      setImageError(null)
    }
  }, [open, post])

  function imageErrorMessage(code: PostImageErrorCode): string {
    if (code === "tooLarge") {
      const mb = (POST_IMAGE_MAX_BYTES / 1024 / 1024).toFixed(0)
      return tPosts("errors.imageTooLarge", { max: mb })
    }
    if (code === "invalidType") {
      const types = POST_IMAGE_ALLOWED_TYPES.map((t) => t.replace("image/", "")).join(", ")
      return tPosts("errors.imageInvalidType", { types })
    }
    if (code === "unauthorized") return tPosts("errors.imageUnauthorized")
    return tPosts("errors.uploadFailed")
  }

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const mutation = isEdit ? updatePost : createPost
  const isPending = mutation.isPending || uploading

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ""
    if (!file) return

    const code = validatePostImage(file)
    if (code) {
      const msg = imageErrorMessage(code)
      setImageError(msg)
      toast.error(msg)
      return
    }

    setImageError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function submit() {
    const text = content.trim()
    if ((!text && !imageFile) || isPending) return

    setUploading(true)
    setImageError(null)
    try {
      let mediaUrl: string | undefined
      if (imageFile) {
        const { uploadPostImage } = await import(
          "@/features/posts/api/storage-client"
        )
        try {
          mediaUrl = await uploadPostImage(imageFile, user.id)
        } catch (err) {
          const code: PostImageErrorCode =
            err instanceof PostImageError ? err.code : "uploadFailed"
          const msg = imageErrorMessage(code)
          setImageError(msg)
          toast.error(msg)
          return
        }
      }

      if (isEdit && post) {
        const unchanged =
          text === post.content && visibility === post.visibility && !mediaUrl
        if (unchanged) {
          onClose()
          return
        }
        await updatePost.mutateAsync({
          postId: post.id,
          content: text || post.content,
          visibility,
        })
      } else {
        await createPost.mutateAsync({
          content: text,
          visibility,
          mediaUrl,
        })
      }

      setContent("")
      setVisibility("public")
      removeImage()
      onClose()
    } finally {
      setUploading(false)
    }
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

              {imagePreview && (
                <div className="relative mt-3 rounded-xl overflow-hidden border border-border/30">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-muted/20"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {imageError ? (
                <ErrorAlert
                  className="mt-3"
                  message={imageError}
                  onDismiss={() => setImageError(null)}
                />
              ) : null}
            </div>
            <div className="p-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept={POST_IMAGE_ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  aria-label={tHome("photoVideo")}
                  onClick={() => fileRef.current?.click()}
                  className={`p-2 rounded-xl transition-colors ${
                    imageFile
                      ? "text-blue-500 bg-blue-500/10"
                      : "text-blue-500 hover:bg-blue-500/10"
                  }`}
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
                disabled={(!content.trim() && !imageFile) || isPending}
                className="px-6 rounded-xl font-semibold"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{tPosts("publishing")}</>
                ) : isPending ? (
                  isEdit ? tPosts("updating") : tPosts("publishing")
                ) : isEdit ? (
                  tPosts("save")
                ) : (
                  tPosts("publish")
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
