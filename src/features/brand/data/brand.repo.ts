import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { BrandSettings } from "../types"
import { BRAND_KEYS } from "../schemas"

export async function loadBrandSettings(): Promise<BrandSettings> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("system_settings")
    .select("setting_key, value")
    .in("setting_key", BRAND_KEYS as unknown as string[])

  const map = new Map<string, string | null>()
  for (const row of (data ?? []) as Array<{ setting_key: string; value: unknown }>) {
    const val = row.value
    map.set(row.setting_key, val == null ? null : String(val))
  }

  return {
    siteName: map.get("site_name") ?? "Joblink",
    siteDescription: map.get("site_description") ?? null,
    logoUrl: map.get("site_logo_url") ?? null,
    faviconUrl: map.get("site_favicon_url") ?? null,
  }
}

export async function updateBrandSettings(
  key: string,
  value: string | null,
  updatedBy: number,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from("system_settings")
    .update({ value: value as never, updated_by: updatedBy })
    .eq("setting_key", key)
}

export async function bulkUpdateBrandSettings(
  entries: Array<{ key: string; value: string | null; updatedBy: number }>,
): Promise<void> {
  const supabase = createAdminClient()
  for (const { key, value, updatedBy } of entries) {
    await supabase
      .from("system_settings")
      .update({ value: value as never, updated_by: updatedBy })
      .eq("setting_key", key)
  }
}
