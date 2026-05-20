"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { signOutClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => signOutClient(),
    onSuccess: () => {
      queryClient.clear()
      toast.success("Đã đăng xuất")
      router.replace("/login")
      router.refresh()
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error))
    },
  })
}
