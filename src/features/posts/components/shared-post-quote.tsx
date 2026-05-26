"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ImageOff } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"
import { readSharedOriginal } from "../lib/media"
import type { FeedPost } from "../types"
import { PostMediaView } from "./post-media-view"
import type { MediaItem } from "../lib/media"

export function SharedPostQuote({
  media,
  onOpenLightbox,
}: {
  media: FeedPost["media"]
  onOpenLightbox: (items: MediaItem[], index: number) => void
}) {
  const t = useTranslations("posts")
  const original = readSharedOriginal(media)
  if (!original) return null

  if (original.deleted) {
    return (
      <div className="mt-3 rounded-2xl border border-border/40 bg-muted/20 px-4 py-6 flex flex-col items-center gap-2 text-muted-foreground">
        <ImageOff className="w-6 h-6" />
        <p className="text-[12px]">{t("originalDeleted")}</p>
      </div>
    )
  }

  const initials = getInitials(original.author.displayName, "JL")

  return (
    <div className="mt-3 rounded-2xl border border-border/40 bg-muted/10 overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${original.authorId}`}>
            <Avatar className="w-9 h-9 border border-border/40 hover:opacity-80 transition-opacity">
              {original.author.avatarUrl ? (
                <AvatarImage src={original.author.avatarUrl} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={`/profile/${original.authorId}`}
              className="font-headline font-bold text-foreground text-[13px] hover:text-primary transition-colors leading-none block truncate"
            >
              {original.author.displayName}
            </Link>
            {original.author.headline ? (
              <p className="text-[11px] text-muted-foreground leading-none mt-1 truncate">
                {original.author.headline}
              </p>
            ) : null}
            {original.createdAt ? (
              <p className="text-[10px] text-muted-foreground mt-1">
                {formatRelativeTime(original.createdAt)}
              </p>
            ) : null}
          </div>
        </div>

        {original.content ? (
          <div className="mt-3 text-[13px] text-foreground/90 leading-relaxed whitespace-pre-line font-body">
            {original.content}
          </div>
        ) : null}
      </div>

      <PostMediaView media={original.media} onOpen={onOpenLightbox} />

      <Link
        href={`/posts/${original.id}`}
        className="block px-3 sm:px-4 py-2 text-[11px] text-primary hover:underline border-t border-border/30"
      >
        {t("viewOriginalPost")}
      </Link>
    </div>
  )
}
