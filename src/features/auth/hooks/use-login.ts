"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { signInWithPasswordClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { LoginInput } from "../schemas"

type UseLoginOptions = {
  redirectTo?: string
}

export function useLogin({ redirectTo = "/home" }: UseLoginOptions = {}) {
  const router = useRouter()

  return useMutation({
    mutationFn: (input: LoginInput) => signInWithPasswordClient(input),
    onSuccess: () => {
      toast.success("Đăng nhập thành công")
      router.replace(redirectTo)
      router.refresh()
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error))
    },
  })
}
