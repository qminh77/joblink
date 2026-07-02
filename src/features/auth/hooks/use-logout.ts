"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { signOutClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"

export function useLogout() {
  const queryClient = useQueryClient()
  const t = useTranslations("auth.logout")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: () => signOutClient(),
    onSuccess: () => {
      queryClient.clear()
      toast.success(t("success"))
      window.location.replace("/login")
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
