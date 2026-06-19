"use client"

import { X } from "lucide-react"
import { useTranslations } from "next-intl"

export function VideoPreview({
  previewUrl,
  onRemove,
}: {
  previewUrl: string
  onRemove: () => void
}) {
  const tPosts = useTranslations("posts")

  return (
    <div className="mt-3 relative rounded-xl overflow-hidden bg-black">
      <video
        src={previewUrl}
        controls
        className="w-full max-h-80"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={tPosts("removeVideo")}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
