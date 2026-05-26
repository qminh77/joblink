"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { registerCompanyAction } from "../api/auth-actions"
import { signUpMemberClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { RegisterInput } from "../schemas"

type RegisterMutationResult =
  | { kind: "member"; hasSession: boolean }
  | { kind: "company" }

export function useRegister() {
  const router = useRouter()
  const t = useTranslations("auth.register")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation<RegisterMutationResult, Error, RegisterInput>({
    mutationFn: async (input) => {
      if (input.role === "company") {
        const result = await registerCompanyAction(input)
        if (!result.ok) {
          throw new Error(result.error)
        }
        return { kind: "company" }
      }
      const data = await signUpMemberClient(input)
      return { kind: "member", hasSession: Boolean(data.session) }
    },
    onSuccess: (result) => {
      if (result.kind === "company") {
        toast.success(t("successCompanyPending"))
        router.replace("/login")
        return
      }
      if (result.hasSession) {
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
