"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { updatePasswordAction } from "../api/auth-actions"
import type { UpdatePasswordInput } from "../schemas"

export function useUpdatePassword() {
  const router = useRouter()
  const t = useTranslations("settings.password") // Sử dụng chung translation với settings.password
  
  return useMutation({
    mutationFn: async (input: UpdatePasswordInput) => {
      const result = await updatePasswordAction(input)
      if (!result.ok) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      toast.success(t("success"))
      router.push("/settings") // Chuyển về settings sau khi cập nhật thành công
    },
    onError: (error) => {
      toast.error(error.message || t("updateFailed"))
    },
  })
}
