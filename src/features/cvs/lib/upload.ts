// Helper upload PDF lên bucket private `cv` từ phía client (giống pattern
// avatar/cover trong profile/lib/media.ts). Bucket có RLS chỉ cho user ghi
// vào folder của chính mình — server action sau đó verify path khi đăng ký
// metadata.

import { createClient } from "@/lib/supabase/client"

import {
  CV_ALLOWED_MIME,
  CV_BUCKET,
  CV_MAX_BYTES,
} from "./constants"

export type CvUploadErrorCode =
  | "tooLarge"
  | "invalidType"
  | "uploadFailed"
  | "unauthorized"

export class CvUploadError extends Error {
  code: CvUploadErrorCode
  constructor(code: CvUploadErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
  }
}

export function validateCvFile(file: File): CvUploadErrorCode | null {
  if (file.type !== CV_ALLOWED_MIME) return "invalidType"
  if (file.size <= 0 || file.size > CV_MAX_BYTES) return "tooLarge"
  return null
}

function mapSupabaseError(message: string): CvUploadErrorCode {
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

export type CvUploadResult = {
  storagePath: string
  fileSize: number
}

// Upload file PDF lên bucket `cv` với path `<userId>/<uuid>.pdf`. Trả storagePath
// để caller submit kèm metadata qua registerCvAction.
export async function uploadCvFile(args: {
  file: File
  userId: number
}): Promise<CvUploadResult> {
  const code = validateCvFile(args.file)
  if (code) throw new CvUploadError(code)

  const supabase = createClient()
  const path = `${args.userId}/${crypto.randomUUID()}.pdf`

  const { error } = await supabase.storage.from(CV_BUCKET).upload(path, args.file, {
    contentType: CV_ALLOWED_MIME,
    cacheControl: "3600",
    upsert: false,
  })
  if (error) {
    throw new CvUploadError(mapSupabaseError(error.message), error.message)
  }

  return { storagePath: path, fileSize: args.file.size }
}
