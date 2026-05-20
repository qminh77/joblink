"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { signUpWithPasswordClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { RegisterInput } from "../schemas"

export function useRegister() {
  const router = useRouter()
  const t = useTranslations("auth.register")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: (input: RegisterInput) => signUpWithPasswordClient(input),
    onSuccess: (data) => {
      const hasSession = Boolean(data.session)
      if (hasSession) {
        toast.success(t("successWithSession"))
        router.push("/home")
        return
      }
      toast.success(t("successNeedVerify"))
      router.replace("/login")
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
