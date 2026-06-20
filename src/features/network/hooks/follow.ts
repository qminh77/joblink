"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { toggleFollowUserAction } from "../api/actions"
import type { ToggleFollowUserResult } from "../types"

const FOLLOW_ERRORS = new Set([
  "invalidUser",
  "unauthorized",
  "selfFollow",
  "userNotFound",
  "targetInactive",
  "unknown",
  "unexpected",
])

function translateFollowError(
  t: (key: string) => string,
  raw: string | undefined,
) {
  if (!raw) return t("unexpected")
  if (FOLLOW_ERRORS.has(raw)) return t(raw)
  return raw
}

export function useToggleFollowUser() {
  const te = useTranslations("network.errors")
  return useMutation<ToggleFollowUserResult, Error, number>({
    mutationFn: async (targetUserId) => {
      const result = await toggleFollowUserAction(targetUserId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onError: (error) => {
      toast.error(translateFollowError(te, error.message))
    },
  })
}
