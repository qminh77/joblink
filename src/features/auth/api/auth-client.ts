"use client"

import { createClient } from "@/lib/supabase/client"

import type {
  ForgotPasswordInput,
  LoginInput,
  MemberRegisterInput,
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

export async function signUpMemberClient(input: MemberRegisterInput) {
  const supabase = createClient()

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { role: "member", full_name: input.fullName },
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
