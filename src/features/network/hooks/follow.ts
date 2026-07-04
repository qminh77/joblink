"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FEED_QUERY_KEY } from "@/features/posts/hooks/keys"

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
  const queryClient = useQueryClient()

  return useMutation<ToggleFollowUserResult, Error, number>({
    mutationFn: async (targetUserId) => {
      const result = await toggleFollowUserAction(targetUserId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY })
    },
    onError: (error) => {
      toast.error(translateFollowError(te, error.message))
    },
  })
}
