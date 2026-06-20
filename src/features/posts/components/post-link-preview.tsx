"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, ImageIcon, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"
import {
  getPostPreviewAction,
  type PostPreviewData,
} from "@/features/posts/api/preview-actions"

type Props = {
  postId: number
  /** Màu nền — thích ứng theo isMe của message bubble */
  variant?: "incoming" | "outgoing"
}

/**
 * Trích xuất ảnh thumbnail đầu tiên từ post media JSONB.
 */
function getFirstImage(media: unknown): string | null {
  if (!media || typeof media !== "object") return null
  const m = media as Record<string, unknown>
  if (m.type === "image" && Array.isArray(m.items) && m.items.length > 0) {
    const first = m.items[0] as Record<string, unknown> | undefined
    return typeof first?.url === "string" ? first.url : null
  }
  if (m.type === "shared") {
    const original = m.original as Record<string, unknown> | undefined
    if (original?.media) return getFirstImage(original.media)
  }
  if (typeof m.url === "string") return m.url
  return null
}

/**
 * Rút gọn nội dung bài viết cho preview.
 */
function excerpt(text: string, max = 120): string {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max).trimEnd() + "…"
}

export function PostLinkPreview({ postId, variant = "incoming" }: Props) {
  const [data, setData] = useState<PostPreviewData>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const formatRel = useRelativeTimeFormatter()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    getPostPreviewAction(postId)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading preview…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Link
        href={`/posts/${postId}`}
        className="text-xs text-primary hover:underline inline-block"
      >
        View post #{postId}
      </Link>
    )
  }

  const { authorName, authorAvatarUrl, content, media } = data
  const imageUrl = getFirstImage(media)
  const isOutgoing = variant === "outgoing"

  return (
    <Link
      href={`/posts/${postId}`}
      className={cn(
        "block rounded-xl overflow-hidden border mt-1.5 transition-colors",
        isOutgoing
          ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/15"
          : "bg-background/80 border-border/40 hover:bg-muted/60",
      )}
    >
      {imageUrl ? (
        <div className="aspect-[16/9] relative overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5 shrink-0">
            {authorAvatarUrl ? <AvatarImage src={authorAvatarUrl} /> : null}
            <AvatarFallback className="text-[9px]">
              {getInitials(authorName, "JL")}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "text-xs font-semibold truncate",
              isOutgoing ? "text-primary-foreground/90" : "text-foreground",
            )}
          >
            {authorName}
          </span>
        </div>

        {content ? (
          <p
            className={cn(
              "text-xs leading-relaxed line-clamp-2",
              isOutgoing
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {excerpt(content)}
          </p>
        ) : null}

        <div
          className={cn(
            "flex items-center gap-1 text-[10px] pt-0.5",
            isOutgoing
              ? "text-primary-foreground/60"
              : "text-muted-foreground/70",
          )}
        >
          <FileText className="w-3 h-3" />
          <span>View post</span>
          {data.createdAt ? (
            <>
              <span className="mx-0.5">·</span>
              <span>{formatRel(data.createdAt)}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

/**
 * Component render nội dung message:
 * Text thuần giữ nguyên
 * URL /posts/{id} => PostLinkPreview
 */
export function MessageContent({
  text,
  isMe,
}: {
  text: string
  isMe: boolean
}) {
  const parts = usePostLinks(text)

  if (parts.length === 1 && !parts[0].isLink) {
    return <>{text}</>
  }

  return (
    <span className="space-y-1 block">
      {parts.map((part, i) =>
        part.isLink ? (
          <PostLinkPreview
            key={i}
            postId={part.postId}
            variant={isMe ? "outgoing" : "incoming"}
          />
        ) : (
          <span key={i} className="block whitespace-pre-wrap break-words">
            {part.text}
          </span>
        ),
      )}
    </span>
  )
}

type TextPart =
  | { isLink: false; text: string }
  | { isLink: true; postId: number }

/**
 * Tách message text thành các phần: text thường + post links.
 * Nhận diện URL chứa /posts/{số} (có hoặc không có origin).
 */
function usePostLinks(text: string): TextPart[] {
  const parts: TextPart[] = []
  // Regex: optional origin + /posts/{digits}
  const regex = /(?:https?:\/\/[^\s]*)?\/posts\/(\d+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index)
    if (before) {
      parts.push({ isLink: false, text: before })
    }
    parts.push({ isLink: true, postId: Number(match[1]) })
    lastIndex = match.index + match[0].length
  }

  const remaining = text.slice(lastIndex)
  if (remaining) {
    parts.push({ isLink: false, text: remaining })
  }

  return parts.length > 0 ? parts : [{ isLink: false, text }]
}
