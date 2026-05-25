"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"
import { useTranslations } from "next-intl"

import { readMediaItems, type MediaItem } from "../lib/media"
import type { FeedPost } from "../types"

const FEED_IMAGE_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 640px, 720px"
const TILE_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 320px, 360px"

export function PostMediaView({
  media,
  onOpen,
}: {
  media: FeedPost["media"]
  onOpen: (items: MediaItem[], index: number) => void
}) {
  const t = useTranslations("posts.errors")
  const [brokenSet, setBrokenSet] = useState<ReadonlySet<number>>(new Set())
  const items = readMediaItems(media)
  if (items.length === 0) return null

  const markBroken = (i: number) => {
    setBrokenSet((prev) => {
      if (prev.has(i)) return prev
      const next = new Set(prev)
      next.add(i)
      return next
    })
  }

  // Tất cả ảnh fail → fallback chung. Trường hợp này hay gặp với post cũ
  // dùng bucket `post-media` legacy đã bị tháo public hoặc xoá.
  if (brokenSet.size === items.length) {
    return (
      <div className="mt-3 -mx-4 sm:-mx-0 sm:rounded-xl border-y sm:border border-border/30 bg-muted/20 px-4 py-6 flex flex-col items-center gap-2 text-muted-foreground">
        <ImageOff className="w-6 h-6" />
        <p className="text-[12px]">{t("mediaUnavailable")}</p>
      </div>
    )
  }

  return (
    <div className="mt-3 -mx-4 sm:-mx-0 sm:rounded-xl overflow-hidden border-y sm:border border-border/30 bg-muted/10">
      <MediaGrid
        items={items}
        broken={brokenSet}
        onMarkBroken={markBroken}
        onOpen={(i) => onOpen(items, i)}
      />
    </div>
  )
}

type GridProps = {
  items: MediaItem[]
  broken: ReadonlySet<number>
  onMarkBroken: (i: number) => void
  onOpen: (i: number) => void
}

// Layout strategy: per-tile `aspect-*` thay vì container aspect-ratio.
// Mỗi tile tự xác định kích thước từ width của cell × aspect → ổn định
// trên mọi browser, không phụ thuộc cách grid propagate aspect-ratio.
function MediaGrid({ items, broken, onMarkBroken, onOpen }: GridProps) {
  const n = items.length

  if (n === 1) {
    const it = items[0]!
    return (
      <SingleTile
        item={it}
        broken={broken.has(0)}
        onMarkBroken={() => onMarkBroken(0)}
        onOpen={() => onOpen(0)}
      />
    )
  }

  if (n === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {items.map((it, i) => (
          <Tile
            key={i}
            aspect="aspect-square"
            item={it}
            broken={broken.has(i)}
            onMarkBroken={() => onMarkBroken(i)}
            onClick={() => onOpen(i)}
          />
        ))}
      </div>
    )
  }

  if (n === 3) {
    // 3 cột, tile 0 col-span-2 row-span-2: 2 col × 2 row đều aspect-square
    // → tile 0 vuông (2w × 2w), tile 1+2 vuông nhỏ (w × w). Math khớp.
    return (
      <div className="grid grid-cols-3 gap-0.5">
        <Tile
          className="col-span-2 row-span-2"
          aspect="aspect-square"
          item={items[0]!}
          broken={broken.has(0)}
          onMarkBroken={() => onMarkBroken(0)}
          onClick={() => onOpen(0)}
        />
        <Tile
          aspect="aspect-square"
          item={items[1]!}
          broken={broken.has(1)}
          onMarkBroken={() => onMarkBroken(1)}
          onClick={() => onOpen(1)}
        />
        <Tile
          aspect="aspect-square"
          item={items[2]!}
          broken={broken.has(2)}
          onMarkBroken={() => onMarkBroken(2)}
          onClick={() => onOpen(2)}
        />
      </div>
    )
  }

  if (n === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {items.map((it, i) => (
          <Tile
            key={i}
            aspect="aspect-square"
            item={it}
            broken={broken.has(i)}
            onMarkBroken={() => onMarkBroken(i)}
            onClick={() => onOpen(i)}
          />
        ))}
      </div>
    )
  }

  // 5+ ảnh: hiển thị 4 ô, ô cuối overlay "+N".
  const visible = items.slice(0, 4)
  const overflow = items.length - 4
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {visible.map((it, i) => (
        <Tile
          key={i}
          aspect="aspect-square"
          item={it}
          broken={broken.has(i)}
          onMarkBroken={() => onMarkBroken(i)}
          onClick={() => onOpen(i)}
          overlay={i === 3 && overflow > 0 ? `+${overflow}` : undefined}
        />
      ))}
    </div>
  )
}

function SingleTile({
  item,
  broken,
  onMarkBroken,
  onOpen,
}: {
  item: MediaItem
  broken: boolean
  onMarkBroken: () => void
  onOpen: () => void
}) {
  if (broken) {
    return (
      <div className="w-full bg-muted/20 px-4 py-10 flex flex-col items-center gap-2 text-muted-foreground">
        <ImageOff className="w-6 h-6" />
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full bg-muted/10"
    >
      <Image
        src={item.url}
        alt=""
        width={item.width ?? 1600}
        height={item.height ?? 900}
        sizes={FEED_IMAGE_SIZES}
        className="w-full h-auto max-h-96 object-contain"
        loading="lazy"
        onError={onMarkBroken}
      />
    </button>
  )
}

function Tile({
  item,
  broken,
  onMarkBroken,
  onClick,
  className,
  aspect,
  overlay,
}: {
  item: MediaItem
  broken: boolean
  onMarkBroken: () => void
  onClick: () => void
  className?: string
  aspect: string
  overlay?: string
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={`relative ${aspect} overflow-hidden bg-muted/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${className ?? ""}`}
    >
      {broken ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <ImageOff className="w-5 h-5" />
        </div>
      ) : (
        <Image
          src={item.url}
          alt=""
          fill
          sizes={TILE_SIZES}
          className="object-cover"
          loading="lazy"
          onError={onMarkBroken}
        />
      )}
      {overlay ? (
        <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl pointer-events-none">
          {overlay}
        </div>
      ) : null}
    </div>
  )
}
