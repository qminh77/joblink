import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { createClient } from "@/lib/supabase/server"

import type { NotificationCategory } from "../lib/preferences"

// Data-access cho notification_preferences bằng client RLS. Policy
// notification_preferences_{select,insert,update}_own cho phép người dùng đọc/
// ghi cấu hình của CHÍNH MÌNH. Khoá tự nhiên là (user_id, type) với type là tên
// nhóm (NotificationCategory).

type Supabase = Awaited<ReturnType<typeof createClient>>
type AdminSupabase = ReturnType<typeof createAdminClient>

export type NotificationPreferenceRecord = {
  type: string
  in_app_enabled: boolean
  email_enabled: boolean
}

export function listPreferences(supabase: Supabase, userId: number) {
  return supabase
    .from("notification_preferences")
    .select("type, in_app_enabled, email_enabled")
    .eq("user_id", userId)
}

export function getPreferenceByCategory(
  admin: AdminSupabase,
  userId: number,
  category: NotificationCategory,
) {
  return admin
    .from("notification_preferences")
    .select("in_app_enabled, email_enabled")
    .eq("user_id", userId)
    .eq("type", category)
    .maybeSingle<{ in_app_enabled: boolean; email_enabled: boolean }>()
}

export function upsertPreference(
  supabase: Supabase,
  userId: number,
  category: NotificationCategory,
  inApp: boolean,
  email: boolean,
) {
  return supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      type: category,
      in_app_enabled: inApp,
      email_enabled: email,
    },
    { onConflict: "user_id,type" },
  )
}
