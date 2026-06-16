"use client"

import { useMutation } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { requestPasswordResetAction } from "../api/auth-actions"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { ForgotPasswordInput } from "../schemas"

export function useForgotPassword() {
  const t = useTranslations("auth.forgotPassword")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")
  const locale = useLocale()

  return useMutation({
    // Email đặt lại gửi qua SMTP của Admin (auth-mailer), KHÔNG qua Supabase.
    mutationFn: (input: ForgotPasswordInput) =>
      requestPasswordResetAction({ email: input.email, locale }),
    onSuccess: () => {
      toast.success(t("success"))
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
