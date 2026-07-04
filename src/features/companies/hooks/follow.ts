"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { FEED_QUERY_KEY } from "@/features/posts/hooks/keys"

import { toggleFollowCompanyAction } from "../api/actions"
import type { ToggleFollowResult } from "../types"
import { translateFollowError } from "./errors"

export function useToggleFollowCompany(options?: { onRollback?: () => void }) {
  const te = useTranslations("companies.errors")
  const queryClient = useQueryClient()

  return useMutation<ToggleFollowResult, Error, number>({
    mutationFn: async (companyUserId) => {
      const result = await toggleFollowCompanyAction(companyUserId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onSuccess: (result) => {
      if (!result.ok) return
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY })
    },
    onError: (error) => {
      options?.onRollback?.()
      toast.error(translateFollowError(te, error.message))
    },
  })
}
