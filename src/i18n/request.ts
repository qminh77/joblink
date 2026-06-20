import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createAdminClient } from "@/lib/supabase/admin"

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config"

const SETTING_KEYS = [
  "default_locale",
  "default_timezone",
  "default_currency",
  "available_locales",
] as const

type SettingRow = { setting_key: string; value: unknown }

const loadSettings = cache(async (): Promise<Map<string, unknown>> => {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("system_settings")
      .select("setting_key, value")
      .in("setting_key", SETTING_KEYS)
    const map = new Map<string, unknown>()
    if (data) {
      for (const row of data as SettingRow[]) {
        map.set(row.setting_key, row.value)
      }
    }
    return map
  } catch {
    return new Map()
  }
})

export const loadSystemDefaultLocale = cache(async (): Promise<Locale | null> => {
  const map = await loadSettings()
  const v = map.get("default_locale") as string | undefined
  if (v && isLocale(v)) return v
  return null
})

export const loadSystemAvailableLocales = cache(async (): Promise<string[]> => {
  const map = await loadSettings()
  const v = map.get("available_locales")
  if (Array.isArray(v) && v.length > 0) return v as string[]
  return []
})

export const loadSystemDefaultTimezone = cache(async (): Promise<string | null> => {
  const map = await loadSettings()
  const v = map.get("default_timezone") as string | undefined
  return v || null
})

export const loadSystemDefaultCurrency = cache(async (): Promise<string> => {
  const map = await loadSettings()
  const v = map.get("default_currency") as string | undefined
  return v || "VND"
})

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  try {
    const user = await getCurrentUser()
    if (isLocale(user?.appUser.locale)) return user!.appUser.locale as Locale
  } catch {
    // fallback
  }

  const systemLocale = await loadSystemDefaultLocale()
  if (systemLocale) return systemLocale

  return defaultLocale
}

async function ensureAllowedLocale(candidate: Locale): Promise<Locale> {
  const available = await loadSystemAvailableLocales()
  if (available.length === 0) return candidate
  return available.includes(candidate) ? candidate : (available[0] as Locale)
}

export default getRequestConfig(async () => {
  const resolved = await resolveLocale()
  const locale = await ensureAllowedLocale(resolved)
  const timeZone = await loadSystemDefaultTimezone() ?? undefined
  const messages = (await import(`../../messages/${locale}.json`)).default
  return { locale, messages, timeZone }
})
