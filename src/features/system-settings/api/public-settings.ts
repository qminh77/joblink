import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"

export type PublicAuthSettings = {
  recaptcha: {
    enabled: boolean
    siteKey: string | null
  }
  site: {
    name: string
    description: string | null
  }
}

const KEYS = [
  "recaptcha_enabled",
  "recaptcha_site_key",
  "site_name",
  "site_description",
]

export const loadPublicAuthSettings = cache(
  async (): Promise<PublicAuthSettings> => {
    const fallback: PublicAuthSettings = {
      recaptcha: { enabled: false, siteKey: null },
      site: { name: "Joblink", description: null },
    }

    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, value")
        .in("setting_key", KEYS)

      if (error || !data) return fallback

      const map = new Map<string, unknown>()
      for (const row of data as Array<{
        setting_key: string
        value: unknown
      }>) {
        map.set(row.setting_key, row.value)
      }

      const recaptchaEnabled = Boolean(map.get("recaptcha_enabled"))
      const siteKey = (map.get("recaptcha_site_key") as string | null) || null

      return {
        recaptcha: {
          enabled: recaptchaEnabled && !!siteKey,
          siteKey,
        },
        site: {
          name: (map.get("site_name") as string) ?? "Joblink",
          description: (map.get("site_description") as string | null) ?? null,
        },
      }
    } catch {
      return fallback
    }
  },
)

export type MaintenanceState = {
  enabled: boolean
  message: string | null
}

// UC-96: đọc trạng thái bảo trì cho mọi request (rẻ nhờ React cache per-request).
// Fail-open: nếu đọc lỗi thì coi như TẮT bảo trì để không khóa nhầm toàn hệ thống.
export const loadMaintenanceState = cache(
  async (): Promise<MaintenanceState> => {
    const fallback: MaintenanceState = { enabled: false, message: null }
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, value")
        .in("setting_key", ["maintenance_mode", "maintenance_message"])

      if (error || !data) return fallback

      const map = new Map<string, unknown>()
      for (const row of data as Array<{
        setting_key: string
        value: unknown
      }>) {
        map.set(row.setting_key, row.value)
      }

      const message = map.get("maintenance_message")
      return {
        enabled: map.get("maintenance_mode") === true,
        message:
          typeof message === "string" && message.trim() ? message : null,
      }
    } catch {
      return fallback
    }
  },
)
