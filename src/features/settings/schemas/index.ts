import { z } from "zod"

import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"

type Translator = (key: string) => string

export function createChangePasswordSchema(t: Translator) {
  return z
    .object({
      currentPassword: z.string().min(1, t("currentPasswordRequired")),
      newPassword: z
        .string()
        .min(8, t("newPasswordMin"))
        .max(72, t("passwordMax")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("confirmMismatch"),
      path: ["confirmPassword"],
    })
}

export function createPrivacySchema() {
  return z.object({
    profileVisibility: z.enum(PROFILE_VISIBILITIES),
    openToWork: z.boolean(),
  })
}

export const companyOpenToHireSchema = z.object({
  openToHire: z.boolean(),
})

export function createLocaleSchema(t: Translator) {
  return z.object({
    locale: z.enum(["vi", "en"], { message: t("localeInvalid") }),
  })
}

export type ChangePasswordInput = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>
export type PrivacyInput = z.infer<ReturnType<typeof createPrivacySchema>>
export type LocaleInput = z.infer<ReturnType<typeof createLocaleSchema>>
