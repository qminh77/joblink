"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { BarChart2, Globe, Image as ImageIcon, Loader2, Lock, Minus, Plus, Users, X } from "lucide-react"
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
  MAX_POST_IMAGES,
  POST_IMAGE_ALLOWED_TYPES,
  POST_IMAGE_MAX_BYTES,
  PostImageError,
  validatePostImage,
  type PostImageErrorCode,
} from "../api/storage-client"
import { useCreatePost, useUpdatePost } from "../hooks"
import { readMediaItems, readSharedOriginal } from "../lib/media"
import { readPollData } from "../lib/poll"
import type { FeedPost } from "../types"

type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

type KeptImage = {
  id: string
  url: string
  width?: number
  height?: number
}

type PreviewImage = { id: string; previewUrl: string }

function ImagePreviewGrid({
  images,
  onRemove,
  onAddMore,
  addMoreLabel,
}: {
  images: PreviewImage[]
  onRemove: (id: string) => void
  onAddMore?: () => void
  addMoreLabel: string
}) {
  // 1 ảnh: hiển thị full-size như trước; 2+: grid 3 cột, ô vuông.
  if (images.length === 1) {
    const img = images[0]!
    return (
      <div className="relative mt-3 rounded-xl overflow-hidden border border-border/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.previewUrl}
          alt=""
          className="w-full max-h-64 object-contain bg-muted/20"
        />
        <button
          type="button"
          onClick={() => onRemove(img.id)}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="remove"
        >
          <X className="w-4 h-4" />
        </button>
        {onAddMore ? (
          <button
            type="button"
            onClick={onAddMore}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors text-[12px] font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {addMoreLabel}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {images.map((img) => (
        <div
          key={img.id}
          className="relative aspect-square rounded-lg overflow-hidden border border-border/30 bg-muted/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.previewUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {onAddMore ? (
        <button
          type="button"
          onClick={onAddMore}
          className="aspect-square rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Plus className="w-5 h-5" />
          <span>{addMoreLabel}</span>
        </button>
      ) : null}
    </div>
  )
}

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
  const isSharedPost = post != null && readSharedOriginal(post.media) != null

  const [content, setContent] = useState(post?.content ?? "")
  const [visibility, setVisibility] = useState<Visibility>(
    post?.visibility ?? "public",
  )
  const [images, setImages] = useState<PendingImage[]>([])
  const [keptImages, setKeptImages] = useState<KeptImage[]>([])
  const [pollMode, setPollMode] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Reset state khi mở/đổi target — tránh giữ lại nội dung của lần trước.
  useEffect(() => {
    if (open) {
      setContent(post?.content ?? "")
      setVisibility(post?.visibility ?? "public")
      setImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.previewUrl))
        return []
      })
      // Pre-load các ảnh hiện có của bài viết để có thể giữ/xoá khi edit.
      // Bài share (media = { type: "shared", ... }) thì không có ảnh để edit.
      if (post && !readSharedOriginal(post.media)) {
        const items = readMediaItems(post.media)
        setKeptImages(
          items.map((it, i) => ({
            id: `kept-${i}-${it.url}`,
            url: it.url,
            ...(it.width !== undefined ? { width: it.width } : {}),
            ...(it.height !== undefined ? { height: it.height } : {}),
          })),
        )
      } else {
        setKeptImages([])
      }
      setImageError(null)

      if (post?.postType === "poll" && !readSharedOriginal(post.media)) {
        const pollData = readPollData(post.media)
        setPollMode(true)
        setPollOptions(
          pollData?.options.map((o) => o.optionText) ?? ["", ""],
        )
      } else {
        setPollMode(false)
        setPollOptions(["", ""])
      }
    }
  }, [open, post])

  const hasExistingPoll =
    isEdit && post?.postType === "poll" && !isSharedPost

  const activePollOptions = pollOptions
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
  const hasValidPoll = pollMode && activePollOptions.length >= 2

  const totalImages = keptImages.length + images.length

  // Cleanup blob URLs khi component unmount.
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const picked = Array.from(e.target.files ?? [])
    if (fileRef.current) fileRef.current.value = ""
    if (picked.length === 0) return

    const remaining = MAX_POST_IMAGES - keptImages.length - images.length
    if (remaining <= 0) {
      const msg = tPosts("errors.tooManyImages", { max: MAX_POST_IMAGES })
      setImageError(msg)
      toast.error(msg)
      return
    }

    const accepted: PendingImage[] = []
    let rejected: PostImageErrorCode | null = null
    let truncated = false

    for (const file of picked) {
      if (accepted.length >= remaining) {
        truncated = true
        break
      }
      const code = validatePostImage(file)
      if (code) {
        rejected = code
        continue
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted])
      setImageError(null)
    }
    if (truncated) {
      const msg = tPosts("errors.tooManyImages", { max: MAX_POST_IMAGES })
      toast.warning(msg)
    }
    if (rejected) {
      const msg = imageErrorMessage(rejected)
      toast.error(msg)
      if (accepted.length === 0) setImageError(msg)
    }
  }

  function removeImageAt(id: string) {
    if (id.startsWith("kept-")) {
      setKeptImages((prev) => prev.filter((img) => img.id !== id))
      setImageError(null)
      return
    }
    setImages((prev) => {
      const found = prev.find((img) => img.id === id)
      if (found) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
    setImageError(null)
  }

  function removeAllImages() {
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl))
      return []
    })
    setKeptImages([])
    setImageError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function submit() {
    const text = content.trim()
    const hasNewImages = images.length > 0
    const hasAnyImage = totalImages > 0

    if ((!text && !hasAnyImage && !hasValidPoll) || isPending) return

    if (hasValidPoll && hasAnyImage) {
      toast.error(tPosts("errors.pollAndMedia"))
      return
    }

    setUploading(true)
    setImageError(null)
    try {
      let uploadedItems: { url: string; width: number; height: number }[] = []
      if (hasNewImages) {
        const { uploadPostImages } = await import(
          "@/features/posts/api/storage-client"
        )
        try {
          uploadedItems = await uploadPostImages(
            images.map((img) => img.file),
            user.id,
          )
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
        // Poll post: content + visibility + options
        if (post.postType === "poll") {
          const pollData = readPollData(post.media)
          const origOptions = pollData?.options ?? []
          const optionsChanged =
            activePollOptions.length !== origOptions.length ||
            activePollOptions.some(
              (o, i) => o !== (origOptions[i]?.optionText ?? ""),
            )
          const unchanged =
            text === post.content &&
            visibility === post.visibility &&
            !optionsChanged
          if (unchanged) {
            onClose()
            return
          }
          await updatePost.mutateAsync({
            postId: post.id,
            content: text,
            visibility,
            options: activePollOptions.map((opt, i) => ({
              id: pollData?.options[i]?.id,
              optionText: opt,
            })),
          })
        } else if (isSharedPost) {
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
          const keptItems: {
            url: string
            width?: number
            height?: number
          }[] = keptImages.map((k) => ({
            url: k.url,
            ...(k.width !== undefined ? { width: k.width } : {}),
            ...(k.height !== undefined ? { height: k.height } : {}),
          }))
          const originalCount = readMediaItems(post.media).length
          const mediaChanged =
            keptImages.length !== originalCount || uploadedItems.length > 0
          const unchanged =
            text === post.content &&
            visibility === post.visibility &&
            !mediaChanged
          if (unchanged) {
            onClose()
            return
          }
          const finalMedia = [...keptItems, ...uploadedItems]
          await updatePost.mutateAsync({
            postId: post.id,
            content: text,
            visibility,
            mediaItems: finalMedia,
          })
        }
      } else if (hasValidPoll) {
        await createPost.mutateAsync({
          content: text,
          visibility,
          options: activePollOptions,
        })
      } else {
        await createPost.mutateAsync({
          content: text,
          visibility,
          mediaItems: uploadedItems,
        })
      }

      setContent("")
      setVisibility("public")
      removeAllImages()
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

              {pollMode && !hasExistingPoll ? (
                <div className="mt-3 space-y-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions]
                          next[i] = e.target.value
                          setPollOptions(next)
                        }}
                        placeholder={tPosts("pollOption", { n: i + 1 })}
                        maxLength={255}
                        className="flex-1 bg-transparent border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                      />
                      {pollOptions.length > 2 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPollOptions((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={tPosts("removeOption")}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {pollOptions.length < 10 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPollOptions((prev) => [...prev, ""])
                      }
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tPosts("addOption")}</span>
                    </button>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    {pollOptions.filter((o) => o.trim()).length < 2
                      ? tPosts("minOptions")
                      : null}
                  </p>
                </div>
              ) : null}

              {totalImages > 0 && !isSharedPost ? (
                <ImagePreviewGrid
                  images={[
                    ...keptImages.map((k) => ({
                      id: k.id,
                      previewUrl: k.url,
                    })),
                    ...images.map((img) => ({
                      id: img.id,
                      previewUrl: img.previewUrl,
                    })),
                  ]}
                  onRemove={removeImageAt}
                  onAddMore={
                    totalImages < MAX_POST_IMAGES
                      ? () => fileRef.current?.click()
                      : undefined
                  }
                  addMoreLabel={tPosts("addMore")}
                />
              ) : null}

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
                  multiple
                  accept={POST_IMAGE_ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  aria-label={tHome("photoVideo")}
                  onClick={() => {
                    setPollMode(false)
                    fileRef.current?.click()
                  }}
                  disabled={
                    isSharedPost || totalImages >= MAX_POST_IMAGES || pollMode
                  }
                  className={`p-2 rounded-xl transition-colors ${
                    totalImages > 0
                      ? "text-blue-500 bg-blue-500/10"
                      : "text-blue-500 hover:bg-blue-500/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label={tHome("poll")}
                  onClick={() => {
                    if (hasExistingPoll) return
                    setPollMode((v) => !v)
                    if (!pollMode) {
                      removeAllImages()
                    }
                  }}
                  disabled={hasExistingPoll || totalImages > 0 || isSharedPost}
                  className={`p-2 rounded-xl transition-colors ${
                    pollMode
                      ? "text-orange-500 bg-orange-500/10"
                      : "text-orange-500 hover:bg-orange-500/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <BarChart2 className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={submit}
                disabled={
                  (!content.trim() && totalImages === 0 && !hasValidPoll) ||
                  isPending
                }
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
