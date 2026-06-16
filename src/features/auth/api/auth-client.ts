"use client"

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
