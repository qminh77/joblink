import { createClient } from "@/lib/supabase/client"

// Mirror cấu trúc của post-media (xem features/posts/api/storage-client.ts):
//   uploads/<prefix>/<YYYY>/<MM>/<userId>/<uuid>.<ext>
// Hai prefix riêng để dễ phân quyền & dọn rác sau này:
//   - member-avatar: ảnh đại diện (crop 1:1)
//   - member-cover:  ảnh bìa     (crop 3:1)
//   - company-logo:  logo công ty (crop 1:1)
//   - company-cover: ảnh bìa công ty (crop 3:1)
const BUCKET = "uploads"
const AVATAR_PREFIX = "member-avatar"
const COVER_PREFIX = "member-cover"
const COMPANY_AVATAR_PREFIX = "company-logo"
const COMPANY_COVER_PREFIX = "company-cover"

export const PROFILE_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const PROFILE_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const

// Output sau crop: kích thước cố định để feed/avatar render đồng đều.
export const AVATAR_OUTPUT_SIZE = 512 // 512×512
export const COVER_OUTPUT_WIDTH = 1500
export const COVER_OUTPUT_HEIGHT = 500 // 3:1 — đủ rộng để banner trông chuyên nghiệp
export const COVER_ASPECT = COVER_OUTPUT_WIDTH / COVER_OUTPUT_HEIGHT

const JPEG_QUALITY = 0.9
const CACHE_CONTROL_IMMUTABLE = "31536000"

export type ProfileImageErrorCode =
  | "tooLarge"
  | "invalidType"
  | "uploadFailed"
  | "unauthorized"

export class ProfileImageError extends Error {
  code: ProfileImageErrorCode
  constructor(code: ProfileImageErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

export type ProfileImageKind = "avatar" | "cover"

// Vùng crop (đơn vị: pixel trên ảnh gốc). x,y là góc trên-trái.
export type CropRect = {
  x: number
  y: number
  width: number
  height: number
}

export function validateProfileImage(file: File): ProfileImageErrorCode | null {
  if (!(PROFILE_IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return "invalidType"
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) return "tooLarge"
  return null
}

function mapSupabaseError(message: string): ProfileImageErrorCode {
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

function prefixFor(kind: ProfileImageKind) {
  return kind === "avatar" ? AVATAR_PREFIX : COVER_PREFIX
}

function companyPrefixFor(kind: ProfileImageKind) {
  return kind === "avatar" ? COMPANY_AVATAR_PREFIX : COMPANY_COVER_PREFIX
}

function outputDimensions(kind: ProfileImageKind) {
  if (kind === "avatar") {
    return { width: AVATAR_OUTPUT_SIZE, height: AVATAR_OUTPUT_SIZE }
  }
  return { width: COVER_OUTPUT_WIDTH, height: COVER_OUTPUT_HEIGHT }
}

// Render `cropRect` của `bitmap` lên canvas có kích thước đầu ra cố định,
// rồi xuất JPEG. Output cố định giúp DB chỉ lưu URL — UI không cần tính
// lại width/height và bảo đảm avatar tròn không bị méo.
async function cropToJpeg(
  bitmap: ImageBitmap,
  crop: CropRect,
  outW: number,
  outH: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(outW, outH)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new ProfileImageError("uploadFailed", "Canvas 2D unavailable")
    ctx.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      outW,
      outH,
    )
    return canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY })
  }

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new ProfileImageError("uploadFailed", "Canvas 2D unavailable")
  ctx.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  )
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new ProfileImageError("uploadFailed", "toBlob null")),
      "image/jpeg",
      JPEG_QUALITY,
    )
  })
}

export async function readImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch (err) {
    throw new ProfileImageError("invalidType", (err as Error).message)
  }
}

// Crop + upload trong một bước. Caller truyền `crop` (đã chọn qua UI) cho
// ảnh gốc; ta render lên canvas đầu ra cố định, encode JPEG, rồi upload
// thẳng lên Supabase Storage giống flow post-media.
export async function uploadMemberImage(args: {
  file: File
  crop: CropRect
  kind: ProfileImageKind
  userId: number
}): Promise<string> {
  const localCode = validateProfileImage(args.file)
  if (localCode) throw new ProfileImageError(localCode)

  const bitmap = await readImageBitmap(args.file)
  const { width: outW, height: outH } = outputDimensions(args.kind)

  let blob: Blob
  try {
    blob = await cropToJpeg(bitmap, args.crop, outW, outH)
  } finally {
    bitmap.close()
  }

  const supabase = createClient()
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const path = `${prefixFor(args.kind)}/${year}/${month}/${args.userId}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: CACHE_CONTROL_IMMUTABLE,
    upsert: false,
  })
  if (error) {
    throw new ProfileImageError(mapSupabaseError(error.message), error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Upload ảnh đại diện / ảnh bìa cho company — tương tự uploadMemberImage. */
export async function uploadCompanyImage(args: {
  file: File
  crop: CropRect
  kind: ProfileImageKind
  userId: number
}): Promise<string> {
  const localCode = validateProfileImage(args.file)
  if (localCode) throw new ProfileImageError(localCode)

  const bitmap = await readImageBitmap(args.file)
  const { width: outW, height: outH } = outputDimensions(args.kind)

  let blob: Blob
  try {
    blob = await cropToJpeg(bitmap, args.crop, outW, outH)
  } finally {
    bitmap.close()
  }

  const supabase = createClient()
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0")
  const path = `${companyPrefixFor(args.kind)}/${year}/${month}/${args.userId}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: CACHE_CONTROL_IMMUTABLE,
    upsert: false,
  })
  if (error) {
    throw new ProfileImageError(mapSupabaseError(error.message), error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
