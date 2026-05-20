"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { signOutClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations("auth.logout")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: () => signOutClient(),
    onSuccess: () => {
      queryClient.clear()
      toast.success(t("success"))
      router.replace("/login")
      router.refresh()
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
