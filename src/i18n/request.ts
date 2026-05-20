import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { createClient } from "@/lib/supabase/server"

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config"

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("locale")
        .eq("auth_id", user.id)
        .is("deleted_at", null)
        .maybeSingle<{ locale: string | null }>()
      if (isLocale(data?.locale ?? undefined)) return data!.locale as Locale
    }
  } catch {
    // Fallback to default if Supabase not available during build/edge
  }

  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = (await import(`../../messages/${locale}.json`)).default
  return { locale, messages }
})
