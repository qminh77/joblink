import { createClient } from "@/lib/supabase/client"

const BUCKET = "uploads"
const POST_MEDIA_PREFIX = "post-media"

export const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB — khớp với bucket
export const POST_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const

export type PostImageErrorCode =
  | "tooLarge"
  | "invalidType"
  | "uploadFailed"
  | "unauthorized"

export class PostImageError extends Error {
  code: PostImageErrorCode
  constructor(code: PostImageErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

export function validatePostImage(file: File): PostImageErrorCode | null {
  if (!(POST_IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return "invalidType"
  }
  if (file.size > POST_IMAGE_MAX_BYTES) return "tooLarge"
  return null
}

function pickExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  const fromType = file.type.split("/")[1]?.toLowerCase()
  return fromType || "jpg"
}

function mapSupabaseError(message: string): PostImageErrorCode {
  const m = message.toLowerCase()
  if (m.includes("exceeded") || m.includes("payload too large") || m.includes("size")) {
    return "tooLarge"
  }
  if (m.includes("mime") || m.includes("not supported")) return "invalidType"
  if (m.includes("unauthor") || m.includes("jwt") || m.includes("permission")) {
    return "unauthorized"
  }
  return "uploadFailed"
}

// Upload trực tiếp từ browser lên Supabase Storage để tránh giới hạn 1MB
// của Next.js Server Action. RLS đã cho phép `authenticated` ghi vào
// uploads/post-media/<YYYY>/<MM>/<userId>/...
export async function uploadPostImage(
  file: File,
  userId: number,
): Promise<string> {
  const localCode = validatePostImage(file)
  if (localCode) throw new PostImageError(localCode)

  const supabase = createClient()
  const ext = pickExt(file)
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const path = `${POST_MEDIA_PREFIX}/${year}/${month}/${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || `image/${ext}`,
    upsert: false,
  })
  if (error) throw new PostImageError(mapSupabaseError(error.message), error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
