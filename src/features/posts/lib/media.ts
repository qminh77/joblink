import type { FeedPost } from "../types"

export type MediaItem = {
  url: string
  width?: number
  height?: number
}

// `posts.media` JSONB có 2 hình dạng (vì migrate theo từng đợt):
//   Mới:   { type: "image", items: [{url, width?, height?}, ...] }
//   Cũ:    { url, type: "image", width?, height? }   (1 ảnh duy nhất)
// Hàm này normalize cả hai về MediaItem[].
export function readMediaItems(value: FeedPost["media"]): MediaItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  const obj = value as Record<string, unknown>

  if (Array.isArray(obj.items)) {
    const out: MediaItem[] = []
    for (const raw of obj.items as unknown[]) {
      const item = toMediaItem(raw)
      if (item) out.push(item)
    }
    return out
  }

  const fromLegacy = toMediaItem(obj)
  return fromLegacy ? [fromLegacy] : []
}

function toMediaItem(raw: unknown): MediaItem | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const url = typeof r.url === "string" ? r.url : ""
  if (!url) return null
  // Build từng key có giá trị — tránh `width: undefined` vướng strict optional.
  const item: MediaItem = { url }
  if (typeof r.width === "number") item.width = r.width
  if (typeof r.height === "number") item.height = r.height
  return item
}
