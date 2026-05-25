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
export const MAX_POST_IMAGES = 10
const UPLOAD_CONCURRENCY = 3

// Resize trần: ảnh lớn hơn được downscale về cạnh dài nhất 1920px,
// chất lượng JPEG 0.85 — đủ đẹp cho feed, giảm 60-80% dung lượng.
const RESIZE_MAX_DIM = 1920
const RESIZE_QUALITY = 0.85

// Cache 1 năm: path có UUID → immutable.
const CACHE_CONTROL_IMMUTABLE = "31536000"

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

export type UploadedPostImage = {
  url: string
  width: number
  height: number
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

// Đo dimension + resize nếu vượt RESIZE_MAX_DIM. GIF được bỏ qua để không
// mất animation; ảnh còn lại nén về JPEG cho hiệu suất feed.
async function prepareImage(
  file: File,
): Promise<{ file: File; width: number; height: number }> {
  if (file.type === "image/gif") {
    const dims = await readDimensions(file)
    return { file, ...dims }
  }

  const bitmap = await createImageBitmap(file)
  const { width: ow, height: oh } = bitmap
  const maxDim = Math.max(ow, oh)

  if (maxDim <= RESIZE_MAX_DIM) {
    bitmap.close()
    return { file, width: ow, height: oh }
  }

  const scale = RESIZE_MAX_DIM / maxDim
  const w = Math.round(ow * scale)
  const h = Math.round(oh * scale)

  const blob = await rasterToJpeg(bitmap, w, h, RESIZE_QUALITY)
  bitmap.close()

  const resized = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, "") + ".jpg",
    { type: "image/jpeg" },
  )
  return { file: resized, width: w, height: h }
}

async function rasterToJpeg(
  bitmap: ImageBitmap,
  w: number,
  h: number,
  quality: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new PostImageError("uploadFailed", "Canvas 2D unavailable")
    ctx.drawImage(bitmap, 0, 0, w, h)
    return canvas.convertToBlob({ type: "image/jpeg", quality })
  }

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new PostImageError("uploadFailed", "Canvas 2D unavailable")
  ctx.drawImage(bitmap, 0, 0, w, h)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new PostImageError("uploadFailed", "toBlob null")),
      "image/jpeg",
      quality,
    )
  })
}

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const dims = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dims
}

// Upload trực tiếp từ browser lên Supabase Storage để tránh giới hạn 1MB
// của Next.js Server Action. RLS đã cho phép `authenticated` ghi vào
// uploads/post-media/<YYYY>/<MM>/<userId>/...
export async function uploadPostImage(
  rawFile: File,
  userId: number,
): Promise<UploadedPostImage> {
  const localCode = validatePostImage(rawFile)
  if (localCode) throw new PostImageError(localCode)

  let prepared: { file: File; width: number; height: number }
  try {
    prepared = await prepareImage(rawFile)
  } catch (err) {
    if (err instanceof PostImageError) throw err
    throw new PostImageError("uploadFailed", (err as Error).message)
  }

  const supabase = createClient()
  const ext = pickExt(prepared.file)
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const path = `${POST_MEDIA_PREFIX}/${year}/${month}/${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, prepared.file, {
    contentType: prepared.file.type || `image/${ext}`,
    cacheControl: CACHE_CONTROL_IMMUTABLE,
    upsert: false,
  })
  if (error) throw new PostImageError(mapSupabaseError(error.message), error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, width: prepared.width, height: prepared.height }
}

// Upload nhiều file song song, nhưng giới hạn concurrency để tránh
// đánh sập băng thông trên mạng yếu. Throw ngay lỗi đầu tiên — caller
// tự dọn các file đã upload thành công nếu muốn rollback.
export async function uploadPostImages(
  files: File[],
  userId: number,
): Promise<UploadedPostImage[]> {
  if (files.length === 0) return []
  if (files.length > MAX_POST_IMAGES) {
    throw new PostImageError("uploadFailed", `Tối đa ${MAX_POST_IMAGES} ảnh`)
  }

  const results: UploadedPostImage[] = new Array(files.length)
  let next = 0

  async function worker() {
    while (true) {
      const i = next++
      if (i >= files.length) return
      results[i] = await uploadPostImage(files[i]!, userId)
    }
  }

  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, files.length) },
    worker,
  )
  await Promise.all(workers)
  return results
}
