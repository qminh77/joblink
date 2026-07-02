"use client"

// SRS UC Trace - M01 Tai khoan va dang nhap:
// UC-04 Dang nhap bang email/mat khau; UC-05 Dang nhap bang Google qua Supabase OAuth button; UC-08 Dang xuat.
// Flow: auth form/menu -> client auth action -> Supabase Auth session -> middleware/auth-server gate.

import { createClient } from "@/lib/supabase/client"

import type { LoginInput } from "../schemas"

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
