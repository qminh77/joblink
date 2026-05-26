"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

import { signInWithPasswordClient, signOutClient } from "../api/auth-client"
import { getAuthErrorMessage } from "../lib/error-messages"
import type { LoginInput } from "../schemas"

type UseLoginOptions = {
  redirectTo?: string
}

class AuthGateError extends Error {
  code: "company_pending" | "account_suspended" | "account_banned"
  constructor(code: AuthGateError["code"], message: string) {
    super(message)
    this.code = code
  }
}

export function useLogin({ redirectTo = "/home" }: UseLoginOptions = {}) {
  const router = useRouter()
  const t = useTranslations("auth.login")
  const tErr = useTranslations("auth.errors")
  const tCommon = useTranslations("common")

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const data = await signInWithPasswordClient(input)
      const authId = data.user?.id
      if (!authId) return data

      const supabase = createClient()
      const { data: appUser } = await supabase
        .from("users")
        .select("role, status")
        .eq("auth_id", authId)
        .is("deleted_at", null)
        .maybeSingle<{ role: string; status: string }>()

      if (!appUser) return data

      if (
        appUser.role === "company" &&
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
      return data
    },
    onSuccess: () => {
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
