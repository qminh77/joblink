"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { toggleFollowCompanyAction } from "../api/actions"
import type { ToggleFollowResult } from "../types"
import { translateFollowError } from "./errors"

export function useToggleFollowCompany(options?: { onRollback?: () => void }) {
  const te = useTranslations("companies.errors")

  return useMutation<ToggleFollowResult, Error, number>({
    mutationFn: async (companyUserId) => {
      const result = await toggleFollowCompanyAction(companyUserId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onError: (error) => {
      options?.onRollback?.()
      toast.error(translateFollowError(te, error.message))
    },
  })
}
