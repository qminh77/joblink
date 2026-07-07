"use client"

// SRS UC Trace - M01 Tai khoan va dang nhap:
// UC-04 Dang nhap bang email/mat khau; UC-05 Dang nhap bang Google qua Supabase OAuth button; UC-08 Dang xuat.
// Flow: auth form/menu -> client auth action -> Supabase Auth session -> middleware/auth-server gate.

import { createClient } from "@/lib/supabase/client"

import type { LoginInput } from "../schemas"

export type AuthGateErrorCode =
  | "user_not_found"
  | "company_pending"
  | "account_suspended"
  | "account_banned"

export class AuthGateError extends Error {
  code: AuthGateErrorCode

  constructor(code: AuthGateErrorCode) {
    super(code)
    this.code = code
  }
}

export async function signInWithPasswordClient(input: LoginInput) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) throw error
  return data
}

export async function signOutClient() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function signInAndValidateClient(input: LoginInput) {
  const data = await signInWithPasswordClient(input)
  const authId = data.user?.id
  if (!authId) return data

  const supabase = createClient()
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; role: string; status: string }>()

  if (appUserError) {
    await signOutClient()
    throw appUserError
  }

  if (!appUser) {
    await signOutClient()
    throw new AuthGateError("user_not_found")
  }

  if (appUser.role === "company") {
    if (appUser.status === "pending_verification") {
      await signOutClient()
      throw new AuthGateError("company_pending")
    }

    if (appUser.status === "active") {
      const { data: company } = await supabase
        .from("company_profiles")
        .select("verification_status")
        .eq("user_id", appUser.id)
        .is("deleted_at", null)
        .maybeSingle<{ verification_status: string }>()
        
      if (company?.verification_status !== "verified") {
        await signOutClient()
        throw new AuthGateError("company_pending")
      }
    }
  }
  if (appUser.status === "suspended") {
    await signOutClient()
    throw new AuthGateError("account_suspended")
  }
  if (appUser.status === "banned") {
    await signOutClient()
    throw new AuthGateError("account_banned")
  }

  return data
}
