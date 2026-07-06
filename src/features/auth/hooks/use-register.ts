"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  registerCompanyAction,
  registerMemberAction,
} from "../api/auth-actions"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { RegisterInput } from "../schemas"

type RegisterMutationResult =
  | { kind: "member"; verifyRequired: boolean }
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
      // Đăng ký qua server action: tạo user + gửi email xác minh qua SMTP.
      // Không tạo session — người dùng phải xác minh email trước khi đăng nhập.
      const result = await registerMemberAction(input)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return { kind: "member", verifyRequired: result.verifyRequired }
    },
    onMutate: (input) => {
      // Optimistic UI: Immediately show success and redirect without waiting for SMTP/backend
      if (input.role === "company") {
        toast.success(t("successCompanyPending"))
        router.replace("/login")
        return
      }
      // For members, we optimistically assume verify is required
      toast.success(t("successNeedVerify"))
      router.replace("/login")
    },
    onSuccess: () => {
      // Handled optimistically in onMutate
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
