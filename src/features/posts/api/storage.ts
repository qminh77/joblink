"use server"

import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "post-media"

export async function uploadPostImageAction(
  base64: string,
  userId: number,
): Promise<string> {
  const admin = createAdminClient()

  const { data: existing } = await admin.storage.getBucket(BUCKET)
  if (!existing) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    })
  }

  const ext = base64.match(/^data:image\/(\w+);/)?.[1] ?? "jpg"
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(base64.split(",")[1]!, "base64")

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: `image/${ext}`,
    upsert: true,
  })
  if (error) throw new Error(error.message)

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}
