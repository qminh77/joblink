"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { signUpWithPasswordClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { RegisterInput } from "../schemas"

export function useRegister() {
  const router = useRouter()

  return useMutation({
    mutationFn: (input: RegisterInput) => signUpWithPasswordClient(input),
    onSuccess: (data) => {
      const hasSession = Boolean(data.session)
      if (hasSession) {
        toast.success("Đăng ký thành công")
        router.replace("/home")
        router.refresh()
        return
      }
      toast.success(
        "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
      )
      router.replace("/login")
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error))
    },
  })
}
