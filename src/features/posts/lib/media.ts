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
    return (obj.items as unknown[])
      .map((raw) => {
        if (!raw || typeof raw !== "object") return null
        const r = raw as Record<string, unknown>
        const url = typeof r.url === "string" ? r.url : ""
        if (!url) return null
        return {
          url,
          width: typeof r.width === "number" ? r.width : undefined,
          height: typeof r.height === "number" ? r.height : undefined,
        }
      })
      .filter((x): x is MediaItem => x !== null)
  }

  if (typeof obj.url === "string" && obj.url.length > 0) {
    return [
      {
        url: obj.url,
        width: typeof obj.width === "number" ? obj.width : undefined,
        height: typeof obj.height === "number" ? obj.height : undefined,
      },
    ]
  }

  return []
}
