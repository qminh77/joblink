import "server-only"

import { unstable_cache } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

export type PublicAuthSettings = {
  site: {
    name: string
    description: string | null
  }
  googleAuthEnabled: boolean
}

const AUTH_KEYS = ["site_name", "site_description", "google_auth_enabled"]

export const loadPublicAuthSettings = unstable_cache(
  async (): Promise<PublicAuthSettings> => {
    const fallback: PublicAuthSettings = {
      site: { name: "Joblink", description: null },
      googleAuthEnabled: false,
    }

    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, value")
        .in("setting_key", AUTH_KEYS)

      if (error || !data) return fallback

      const map = new Map<string, unknown>()
      for (const row of data as Array<{
        setting_key: string
        value: unknown
      }>) {
        map.set(row.setting_key, row.value)
      }

      return {
        site: {
          name: (map.get("site_name") as string) ?? "Joblink",
          description: (map.get("site_description") as string | null) ?? null,
        },
        googleAuthEnabled: Boolean(map.get("google_auth_enabled")),
      }
    } catch {
      return fallback
    }
  },
  ["public-auth-settings"],
  {
    revalidate: 300,
    tags: ["public-auth-settings", "system-settings"],
  },
)
