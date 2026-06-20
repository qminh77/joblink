"use server"

import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"

import { isLocale, LOCALE_COOKIE, type Locale } from "./config"
import { loadSystemAvailableLocales } from "./request"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setLocaleAction(locale: string): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false }

  const available = await loadSystemAvailableLocales()
  if (available.length > 0 && !available.includes(locale)) return { ok: false }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  })

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
    // ignore
  }

  return { ok: true }
}
