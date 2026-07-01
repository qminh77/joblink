"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export function wrapAction<TArgs, TReturn extends { ok: boolean; error?: string }>(
  fn: (args: TArgs) => Promise<TReturn>,
) {
  return async (args: TArgs) => {
    const result = await fn(args)
    if (!result.ok) {
      throw new Error(result.error ?? "Đã xảy ra lỗi")
    }
    return result
  }
}

export function useActionMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  successMessage: string,
) {
  const router = useRouter()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
