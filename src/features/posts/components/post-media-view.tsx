"use client"

import { useState } from "react"
import { ImageOff } from "lucide-react"
import { useTranslations } from "next-intl"

import type { FeedPost } from "../types"

type Media = { url?: string; type?: string }

function readMedia(value: FeedPost["media"]): Media | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const url = (value as Media).url
  if (typeof url !== "string" || url.length === 0) return null
  return value as Media
}

export function PostMediaView({
  media,
  onOpen,
}: {
  media: FeedPost["media"]
  onOpen: (url: string) => void
}) {
  const t = useTranslations("posts")
  const [broken, setBroken] = useState(false)
  const parsed = readMedia(media)
  if (!parsed) return null

  if (broken) {
    return (
      <div className="mt-3 -mx-4 sm:-mx-0 sm:rounded-xl border-y sm:border border-border/30 bg-muted/20 px-4 py-6 flex flex-col items-center gap-2 text-muted-foreground">
        <ImageOff className="w-6 h-6" />
        <p className="text-[12px]">{t("mediaUnavailable")}</p>
      </div>
    )
  }

  return (
    <div className="mt-3 -mx-4 sm:-mx-0 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-border/30 bg-muted/10">
      <button
        type="button"
        className="w-full cursor-pointer"
        onClick={() => onOpen(parsed.url!)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={parsed.url}
          alt=""
          className="w-full max-h-96 object-contain"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </button>
    </div>
  )
}
