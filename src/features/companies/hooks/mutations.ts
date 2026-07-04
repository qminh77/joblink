"use client"

import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { resubmitCompanyVerificationAction } from "../api/actions"
import type { ResubmitVerificationResult } from "../types"
import { translateVerificationError } from "./errors"

export function useResubmitVerification() {
  const te = useTranslations("companies.verificationErrors")
  const ts = useTranslations("companies.verification")

  return useMutation<ResubmitVerificationResult, Error, void>({
    mutationFn: async () => {
      const result = await resubmitCompanyVerificationAction()
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success(ts("resubmitSuccess"))
    },
    onError: (error) => {
      toast.error(translateVerificationError(te, error.message))
    },
  })
}
