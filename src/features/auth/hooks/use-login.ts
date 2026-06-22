"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

import { signInWithPasswordClient, signOutClient } from "../api/auth-client"
import { getAssuranceLevel, listVerifiedTotpFactors } from "../api/mfa-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { LoginInput } from "../schemas"

type UseLoginOptions = {
  redirectTo?: string
  // UC-09/10: gọi khi tài khoản bật 2FA — login chưa hoàn tất, cần nhập mã TOTP.
  onMfaRequired?: (factorId: string | null) => void
}

type LoginOutcome = { mfaRequired: boolean; factorId: string | null }

class AuthGateError extends Error {
  code: "company_pending" | "account_suspended" | "account_banned"
  constructor(code: AuthGateError["code"], message: string) {
    super(message)
    this.code = code
  }
}

export function useLogin({
  redirectTo = "/home",
  onMfaRequired,
}: UseLoginOptions = {}) {
  const router = useRouter()
  const t = useTranslations("auth.login")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const data = await signInWithPasswordClient(input)
      const authId = data.user?.id
      if (!authId) return { mfaRequired: false, factorId: null } as LoginOutcome

      const supabase = createClient()
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("account_type, status")
        .eq("auth_id", authId)
        .is("deleted_at", null)
        .maybeSingle<{ account_type: string; status: string }>()

      if (appUserError) {
        await signOutClient()
        throw appUserError
      }

      if (!appUser) {
        await signOutClient()
        throw new Error(tErr("userNotFound"))
      }

      if (
        appUser.account_type === "company" &&
        appUser.status === "pending_verification"
      ) {
        await signOutClient()
        throw new AuthGateError(
          "company_pending",
          tErr("companyPendingApproval"),
        )
      }
      if (appUser.status === "suspended") {
        await signOutClient()
        throw new AuthGateError("account_suspended", tErr("accountSuspended"))
      }
      if (appUser.status === "banned") {
        await signOutClient()
        throw new AuthGateError("account_banned", tErr("accountBanned"))
      }

      // UC-09/10: nếu tài khoản bật 2FA, phiên đang ở aal1 và cần nâng lên aal2
      // bằng mã TOTP — login chưa hoàn tất ở bước này.
      const aal = await getAssuranceLevel()
      if (aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
        const factors = await listVerifiedTotpFactors()
        return {
          mfaRequired: true,
          factorId: factors[0]?.id ?? null,
        } as LoginOutcome
      }
      return { mfaRequired: false, factorId: null } as LoginOutcome
    },
    onSuccess: (result: LoginOutcome) => {
      if (result.mfaRequired) {
        onMfaRequired?.(result.factorId)
        return
      }
      toast.success(t("success"))
      router.push(redirectTo)
    },
    onError: (error) => {
      if (error instanceof AuthGateError) {
        toast.error(error.message)
        return
      }
      toast.error(getAuthErrorMessage(error, tErr, tCommon))
    },
  })
}
