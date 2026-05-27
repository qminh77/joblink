import type { UserRole } from "@/lib/constants"
import type { FeedAuthor, FeedPost } from "../types"
import type { Json, PostType } from "@/types/database"

export type MediaItem = {
  url: string
  width?: number
  height?: number
}

// `posts.media` JSONB có 3 hình dạng:
//   Image mới:    { type: "image", items: [{url, width?, height?}, ...] }
//   Image cũ:     { url, type: "image", width?, height? }                (1 ảnh)
//   Shared post:  { type: "shared", originalPostId, original: {...} }
// Hàm này normalize ảnh về MediaItem[]; shared trả [] (không có ảnh).
export function readMediaItems(value: FeedPost["media"]): MediaItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  const obj = value as Record<string, unknown>

  if (obj.type === "shared" || obj.type === "poll") return []

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

export type SharedOriginal = {
  id: number
  authorId: number
  content: string
  postType: PostType
  media: Json | null
  createdAt: string
  author: FeedAuthor
  deleted?: boolean
}

export function readSharedOriginal(
  value: FeedPost["media"],
): SharedOriginal | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const obj = value as Record<string, unknown>
  if (obj.type !== "shared") return null

  const original = obj.original as Record<string, unknown> | undefined
  if (!original || typeof original !== "object") return null

  const id = Number(original.id)
  const authorId = Number(original.authorId)
  if (!Number.isFinite(id) || !Number.isFinite(authorId)) return null

  const authorRaw = (original.author ?? {}) as Record<string, unknown>
  const author: FeedAuthor = {
    userId: Number(authorRaw.userId ?? authorId),
    role: (authorRaw.role as UserRole) ?? "member",
    displayName:
      typeof authorRaw.displayName === "string"
        ? authorRaw.displayName
        : "JobLink",
    avatarUrl:
      typeof authorRaw.avatarUrl === "string" ? authorRaw.avatarUrl : null,
    headline:
      typeof authorRaw.headline === "string" ? authorRaw.headline : null,
  }

  return {
    id,
    authorId,
    content: typeof original.content === "string" ? original.content : "",
    postType: ((original.postType as PostType) ?? "text") as PostType,
    media: (original.media as Json | null) ?? null,
    createdAt:
      typeof original.createdAt === "string" ? original.createdAt : "",
    author,
    deleted: original.deleted === true,
  }
}

export function buildSharedMedia(snapshot: SharedOriginal): Json {
  return {
    type: "shared",
    originalPostId: snapshot.id,
    original: {
      id: snapshot.id,
      authorId: snapshot.authorId,
      content: snapshot.content,
      postType: snapshot.postType,
      media: snapshot.media,
      createdAt: snapshot.createdAt,
      author: {
        userId: snapshot.author.userId,
        role: snapshot.author.role,
        displayName: snapshot.author.displayName,
        avatarUrl: snapshot.author.avatarUrl,
        headline: snapshot.author.headline,
      },
    },
  } as unknown as Json
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
