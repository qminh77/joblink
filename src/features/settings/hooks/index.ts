"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("settings.password")
  return useMutation({
    mutationFn: wrap<ChangePasswordInput>(changePasswordAction),
    onSuccess: () => toast.success(t("success")),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdatePrivacy() {
  const router = useRouter()
  const t = useTranslations("settings.privacy")
  return useMutation({
    mutationFn: wrap<PrivacyInput>(updatePrivacyAction),
    onSuccess: () => {
      toast.success(t("success"))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateOpenToHire() {
  const router = useRouter()
  const t = useTranslations("settings.openToHire")
  return useMutation({
    mutationFn: wrap<boolean>(updateCompanyOpenToHireAction),
    onSuccess: () => {
      toast.success(t("success"))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateLocale() {
  const router = useRouter()
  const t = useTranslations("settings.locale")
  return useMutation({
    mutationFn: wrap<LocaleInput>(updateLocaleAction),
    onSuccess: () => {
      toast.success(t("success"))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
