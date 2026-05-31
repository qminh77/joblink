import { z } from "zod"

import {
  CV_ALLOWED_MIME,
  CV_FILE_NAME_MAX,
  CV_MAX_BYTES,
} from "../lib/constants"

type Translator = (key: string, values?: Record<string, string | number>) => string

// Đăng ký CV sau khi client đã upload file lên Storage. Server chỉ chấp nhận
// path dạng `cv/<userId>/<uuid>.pdf` — userId được verify lại trong action.
export function createRegisterCvSchema(t: Translator) {
  return z.object({
    fileName: z
      .string()
      .trim()
      .min(1, t("fileNameRequired"))
      .max(CV_FILE_NAME_MAX, t("fileNameMax", { max: CV_FILE_NAME_MAX })),
    storagePath: z
      .string()
      .min(1)
      .regex(/^\d+\/[A-Za-z0-9-_]+\.pdf$/i, t("invalidStoragePath")),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(CV_MAX_BYTES, t("fileTooLarge")),
    mimeType: z.literal(CV_ALLOWED_MIME, { message: t("invalidMime") }),
    makeDefault: z.boolean().optional(),
  })
}

export function createRenameCvSchema(t: Translator) {
  return z.object({
    id: z.number().int().positive(),
    fileName: z
      .string()
      .trim()
      .min(1, t("fileNameRequired"))
      .max(CV_FILE_NAME_MAX, t("fileNameMax", { max: CV_FILE_NAME_MAX })),
  })
}

export type RegisterCvInput = z.infer<ReturnType<typeof createRegisterCvSchema>>
export type RenameCvInput = z.infer<ReturnType<typeof createRenameCvSchema>>
