import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { getCurrentUser } from "@/features/auth/api/auth-server"

import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config"

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  try {
    // Tái dùng getCurrentUser() (đã cache trong request và cũng do layout gọi)
    // thay vì auth.getUser() + query locale riêng — bỏ 1 round-trip mạng/request.
    const user = await getCurrentUser()
    if (isLocale(user?.appUser.locale)) return user!.appUser.locale as Locale
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
