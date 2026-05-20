"use client"

import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { sendPasswordResetEmailClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { ForgotPasswordInput } from "../schemas"

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) =>
      sendPasswordResetEmailClient(input),
    onSuccess: () => {
      toast.success(
        "Đã gửi email khôi phục. Vui lòng kiểm tra hộp thư của bạn.",
      )
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error))
    },
  })
}
