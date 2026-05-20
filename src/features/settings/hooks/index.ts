"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  changePasswordAction,
  updateCompanyOpenToHireAction,
  updateLocaleAction,
  updatePrivacyAction,
} from "../api/actions"
import type {
  ChangePasswordInput,
  LocaleInput,
  PrivacyInput,
} from "../schemas"

type ActionResult = { ok: true } | { ok: false; error: string }

function wrap<T>(action: (input: T) => Promise<ActionResult>) {
  return async (input: T) => {
    const result = await action(input)
    if (!result.ok) throw new Error(result.error)
  }
}

export function useChangePassword() {
  return useMutation({
    mutationFn: wrap<ChangePasswordInput>(changePasswordAction),
    onSuccess: () => toast.success("Đã đổi mật khẩu thành công"),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdatePrivacy() {
  const router = useRouter()
  return useMutation({
    mutationFn: wrap<PrivacyInput>(updatePrivacyAction),
    onSuccess: () => {
      toast.success("Đã cập nhật quyền riêng tư")
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateOpenToHire() {
  const router = useRouter()
  return useMutation({
    mutationFn: wrap<boolean>(updateCompanyOpenToHireAction),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái tuyển dụng")
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateLocale() {
  const router = useRouter()
  return useMutation({
    mutationFn: wrap<LocaleInput>(updateLocaleAction),
    onSuccess: () => {
      toast.success("Đã cập nhật ngôn ngữ")
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
