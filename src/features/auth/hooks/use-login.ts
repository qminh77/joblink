"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { signInWithPasswordClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { LoginInput } from "../schemas"

type UseLoginOptions = {
  redirectTo?: string
}

export function useLogin({ redirectTo = "/home" }: UseLoginOptions = {}) {
  const router = useRouter()
  const t = useTranslations("auth.login")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: (input: LoginInput) => signInWithPasswordClient(input),
    onSuccess: () => {
      toast.success(t("success"))
      router.push(redirectTo)
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
