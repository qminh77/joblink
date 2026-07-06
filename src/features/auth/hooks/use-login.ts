"use client"

// SRS UC Trace - M01 UC-04 + UC-06.
// Flow: login form submit -> Supabase password sign-in -> app user mirror/status check -> redirect or sign out with business error.

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  AuthGateError,
  signInAndValidateClient,
  type AuthGateErrorCode,
} from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { LoginInput } from "../schemas"
import { logFailedLoginAction } from "../api/auth-actions"

type UseLoginOptions = {
  redirectTo?: string
}

const AUTH_GATE_ERROR_KEYS: Record<AuthGateErrorCode, string> = {
  user_not_found: "userNotFound",
  company_pending: "companyPendingApproval",
  account_suspended: "accountSuspended",
  account_banned: "accountBanned",
}

export function useLogin({ redirectTo = "/home" }: UseLoginOptions = {}) {
  const router = useRouter()
  const t = useTranslations("auth.login")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      await signInAndValidateClient(input)
    },
    onSuccess: () => {
      toast.success(t("success"))
      router.push(redirectTo)
    },
    onError: (error, variables) => {
      if (error instanceof AuthGateError) {
        toast.error(tErr(AUTH_GATE_ERROR_KEYS[error.code]))
        logFailedLoginAction(variables.email, `Gate Error: ${error.code}`)
        return
      }
      const msg = getAuthErrorMessage(error, tErr, tCommon)
      toast.error(msg)
      logFailedLoginAction(variables.email, `Auth Error: ${msg}`)
    },
  })
}
