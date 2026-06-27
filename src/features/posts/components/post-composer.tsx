"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Image as ImageIcon, Loader2, Video, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  MAX_POST_IMAGES,
  POST_IMAGE_ALLOWED_TYPES,
  POST_VIDEO_ALLOWED_TYPES,
} from "../api/storage-client"
import type { FeedPost } from "../types"
import { ImagePreviewGrid } from "./post-composer/image-preview-grid"
import { usePostComposer } from "./post-composer/use-post-composer"
import { VideoPreview } from "./post-composer/video-preview"
import { VisibilityMenu } from "./post-composer/visibility-menu"

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
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")
  const {
    content,
    fileRef,
    handleFileSelect,
    handleVideoSelect,
    imageError,
    images,
    isEdit,
    isPending,
    isSharedPost,
    keptImages,
    removeImageAt,
    removeVideo,
    setContent,
    setImageError,
    setVisibility,
    submit,
    totalImages,
    uploading,
    video,
    videoRef,
    visibility,
  } = usePostComposer({ open, onClose, post, userId: user.id })

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
                  <VisibilityMenu
                    visibility={visibility}
                    onChange={setVisibility}
                  />
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

              {video ? (
                <VideoPreview
                  previewUrl={video.previewUrl}
                  onRemove={removeVideo}
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
                    fileRef.current?.click()
                  }}
                  disabled={
                    isSharedPost ||
                    totalImages >= MAX_POST_IMAGES ||
                    video != null
                  }
                  className={`p-2 rounded-xl transition-colors ${
                    totalImages > 0
                      ? "text-blue-500 bg-blue-500/10"
                      : "text-blue-500 hover:bg-blue-500/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={videoRef}
                  type="file"
                  accept={POST_VIDEO_ALLOWED_TYPES.join(",")}
                  className="hidden"
                  onChange={handleVideoSelect}
                />
                <button
                  type="button"
                  aria-label={tPosts("attachVideo")}
                  onClick={() => {
                    videoRef.current?.click()
                  }}
                  disabled={isSharedPost || totalImages > 0 || isEdit}
                  className={`p-2 rounded-xl transition-colors ${
                    video
                      ? "text-purple-500 bg-purple-500/10"
                      : "text-purple-500 hover:bg-purple-500/10"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={submit}
                disabled={
                  (!content.trim() && totalImages === 0 && !video) ||
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
