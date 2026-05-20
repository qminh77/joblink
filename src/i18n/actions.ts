"use server"

import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"

import { isLocale, LOCALE_COOKIE, type Locale } from "./config"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  })

  // Nếu user đã đăng nhập thì đồng bộ users.locale (best-effort)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("users")
        .update({ locale: locale as Locale, updated_at: new Date().toISOString() })
        .eq("auth_id", user.id)
    }
  } catch {
    // ignore — cookie đã đủ cho phiên hiện tại
  }
}
