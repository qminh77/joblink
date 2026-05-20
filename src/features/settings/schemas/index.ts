import { z } from "zod"

import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự")
      .max(72, "Mật khẩu tối đa 72 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const privacySchema = z.object({
  profileVisibility: z.enum(PROFILE_VISIBILITIES),
  openToWork: z.boolean(),
})

export type PrivacyInput = z.infer<typeof privacySchema>

export const companyOpenToHireSchema = z.object({
  openToHire: z.boolean(),
})

export const localeSchema = z.object({
  locale: z.enum(["vi", "en"]),
})

export type LocaleInput = z.infer<typeof localeSchema>
