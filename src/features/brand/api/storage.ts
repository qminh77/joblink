import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "uploads"
const BRAND_PREFIX = "brand"

export const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024
export const BRAND_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
] as const

export type BrandUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

function pickExt(mime: string, filename: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
  }
  return map[mime] ?? filename.split(".").pop()?.toLowerCase() ?? "png"
}

export async function uploadBrandImage(
  file: File,
  type: "logo" | "favicon",
): Promise<BrandUploadResult> {
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    return { ok: false, error: "file_too_large" }
  }
  if (!(BRAND_IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "invalid_type" }
  }

  const supabase = createAdminClient()
  const ext = pickExt(file.type, file.name)
  const path = `${BRAND_PREFIX}/${type}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  })

  if (error) {
    console.error("[brand.upload]", error)
    return { ok: false, error: "upload_failed" }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}

export async function deleteBrandImage(
  url: string,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    const parsed = new URL(url)
    const pathParts = parsed.pathname.split("/")
    const objectPath = pathParts.slice(pathParts.indexOf("uploads")).join("/")
    if (objectPath.startsWith("uploads/brand/")) {
      await supabase.storage.from(BUCKET).remove([objectPath])
    }
  } catch {
    // fail silently — old file may have been deleted already
  }
}
