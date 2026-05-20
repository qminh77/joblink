"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { sendPasswordResetEmailClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { ForgotPasswordInput } from "../schemas"

export function useForgotPassword() {
  const t = useTranslations("auth.forgotPassword")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      sendPasswordResetEmailClient(input),
    onSuccess: () => {
      toast.success(t("success"))
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
