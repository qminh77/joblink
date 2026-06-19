import "server-only"

import type { Json } from "@/types/database"

export function imageMedia(
  mediaItems: { url: string; width?: number; height?: number }[],
): Json | null {
  return mediaItems.length > 0
    ? ({ type: "image", items: mediaItems } as unknown as Json)
    : null
}
