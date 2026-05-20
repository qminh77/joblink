"use client"

import { createClient } from "@/lib/supabase/client"

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "../schemas"

export async function signInWithPasswordClient(input: LoginInput) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (error) throw error
  return data
}

export async function signUpWithPasswordClient(input: RegisterInput) {
  const supabase = createClient()

  const metadata: Record<string, string> =
    input.role === "company"
      ? { role: "company", company_name: input.companyName }
      : { role: "member", full_name: input.fullName }

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: metadata,
      emailRedirectTo: redirectTo,
    },
  })

  if (error) throw error
  return data
}

export async function sendPasswordResetEmailClient(
  input: ForgotPasswordInput,
) {
  const supabase = createClient()

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/settings`
      : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  })

  if (error) throw error
}

export async function signOutClient() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
