"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  MAX_POST_IMAGES,
  POST_IMAGE_ALLOWED_TYPES,
  POST_IMAGE_MAX_BYTES,
  POST_VIDEO_ALLOWED_TYPES,
  POST_VIDEO_MAX_BYTES,
  PostImageError,
  uploadPostVideo,
  validatePostImage,
  validatePostVideo,
  type PostImageErrorCode,
} from "../../api/storage-client"
import { useCreatePost, useUpdatePost } from "../../hooks"
import { readMediaItems, readSharedOriginal } from "../../lib/media"
import type { FeedPost } from "../../types"
import type { Visibility } from "./visibility-menu"

export type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

export type KeptImage = {
  id: string
  url: string
  width?: number
  height?: number
}

export function usePostComposer({
  open,
  onClose,
  post,
  userId,
}: {
  open: boolean
  onClose: () => void
  post?: FeedPost | null
  userId: number
}) {
  const tPosts = useTranslations("posts")

  const isEdit = post != null
  const isSharedPost = post != null && readSharedOriginal(post.media) != null
  const isVideoPost = post != null && post.postType === "video"

  const [content, setContent] = useState(post?.content ?? "")
  const [visibility, setVisibility] = useState<Visibility>(
    post?.visibility ?? "public",
  )
  const [images, setImages] = useState<PendingImage[]>([])
  const [keptImages, setKeptImages] = useState<KeptImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [video, setVideo] = useState<{ file: File; previewUrl: string } | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return

    setContent(post?.content ?? "")
    setVisibility(post?.visibility ?? "public")
    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      return []
    })

    if (post && !readSharedOriginal(post.media)) {
      const items = readMediaItems(post.media)
      setKeptImages(
        items.map((item, index) => ({
          id: `kept-${index}-${item.url}`,
          url: item.url,
          ...(item.width !== undefined ? { width: item.width } : {}),
          ...(item.height !== undefined ? { height: item.height } : {}),
        })),
      )
    } else {
      setKeptImages([])
    }
    setImageError(null)
    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }, [open, post])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalImages = keptImages.length + images.length

  const createPost = useCreatePost()
  const updatePost = useUpdatePost()
  const mutation = isEdit ? updatePost : createPost
  const isPending = mutation.isPending || uploading

  function videoErrorMessage(code: PostImageErrorCode): string {
    if (code === "tooLarge") {
      const mb = (POST_VIDEO_MAX_BYTES / 1024 / 1024).toFixed(0)
      return tPosts("errors.videoTooLarge", { max: mb })
    }
    if (code === "invalidType") {
      const types = POST_VIDEO_ALLOWED_TYPES.map((type) =>
        type.replace("video/", ""),
      ).join(", ")
      return tPosts("errors.videoInvalidType", { types })
    }
    if (code === "unauthorized") return tPosts("errors.imageUnauthorized")
    return tPosts("errors.uploadFailed")
  }

  function imageErrorMessage(code: PostImageErrorCode): string {
    if (code === "tooLarge") {
      const mb = (POST_IMAGE_MAX_BYTES / 1024 / 1024).toFixed(0)
      return tPosts("errors.imageTooLarge", { max: mb })
    }
    if (code === "invalidType") {
      const types = POST_IMAGE_ALLOWED_TYPES.map((type) =>
        type.replace("image/", ""),
      ).join(", ")
      return tPosts("errors.imageInvalidType", { types })
    }
    if (code === "unauthorized") return tPosts("errors.imageUnauthorized")
    return tPosts("errors.uploadFailed")
  }

  function handleVideoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (videoRef.current) videoRef.current.value = ""
    if (!file) return

    const code = validatePostVideo(file)
    if (code) {
      toast.error(videoErrorMessage(code))
      return
    }

    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return { file, previewUrl: URL.createObjectURL(file) }
    })
  }

  function removeVideo() {
    setVideo((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    if (fileRef.current) fileRef.current.value = ""
    if (picked.length === 0) return

    const remaining = MAX_POST_IMAGES - keptImages.length - images.length
    if (remaining <= 0) {
      const message = tPosts("errors.tooManyImages", { max: MAX_POST_IMAGES })
      setImageError(message)
      toast.error(message)
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
      toast.warning(tPosts("errors.tooManyImages", { max: MAX_POST_IMAGES }))
    }
    if (rejected) {
      const message = imageErrorMessage(rejected)
      toast.error(message)
      if (accepted.length === 0) setImageError(message)
    }
  }

  function removeImageAt(id: string) {
    if (id.startsWith("kept-")) {
      setKeptImages((prev) => prev.filter((image) => image.id !== id))
      setImageError(null)
      return
    }

    setImages((prev) => {
      const found = prev.find((image) => image.id === id)
      if (found) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((image) => image.id !== id)
    })
    setImageError(null)
  }

  function removeAllImages() {
    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl))
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

    if ((!text && !hasAnyImage && !video) || isPending) return

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
            images.map((image) => image.file),
            userId,
          )
        } catch (error) {
          const code: PostImageErrorCode =
            error instanceof PostImageError ? error.code : "uploadFailed"
          const message = imageErrorMessage(code)
          setImageError(message)
          toast.error(message)
          return
        }
      }

      if (isEdit && post) {
        if (isSharedPost || isVideoPost) {
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
          const keptItems = keptImages.map((image) => ({
            url: image.url,
            ...(image.width !== undefined ? { width: image.width } : {}),
            ...(image.height !== undefined ? { height: image.height } : {}),
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
          await updatePost.mutateAsync({
            postId: post.id,
            content: text,
            visibility,
            mediaItems: [...keptItems, ...uploadedItems],
          })
        }
      } else if (video) {
        let videoUrl: string
        try {
          videoUrl = await uploadPostVideo(video.file, userId)
        } catch (error) {
          const code: PostImageErrorCode =
            error instanceof PostImageError ? error.code : "uploadFailed"
          const message = videoErrorMessage(code)
          setImageError(message)
          toast.error(message)
          return
        }
        await createPost.mutateAsync({ content: text, visibility, videoUrl })
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
      removeVideo()
      onClose()
    } finally {
      setUploading(false)
    }
  }

  return {
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
    removeAllImages,
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
  }
}
