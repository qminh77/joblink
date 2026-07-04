import "server-only"

import { assertOk } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import {
  listPreferences,
  upsertPreference,
  type NotificationPreferenceRecord,
} from "../data/preferences.repo"
import {
  defaultPreferenceMap,
  type NotificationCategory,
  type NotificationPreferenceMap,
} from "../lib/preferences"
import type { UpdateNotificationPreferenceInput } from "../schemas"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function loadNotificationPreferences(
  supabase: Supabase,
  userId: number,
): Promise<NotificationPreferenceMap> {
  const { data } = await listPreferences(supabase, userId)
  return preferenceMapFromRows((data ?? []) as NotificationPreferenceRecord[])
}

export async function saveNotificationPreference(
  supabase: Supabase,
  userId: number,
  input: UpdateNotificationPreferenceInput,
): Promise<void> {
  assertOk(
    await upsertPreference(
      supabase,
      userId,
      input.category,
      input.inApp,
      input.email,
    ),
    "unexpected",
  )
}

function preferenceMapFromRows(
  rows: NotificationPreferenceRecord[],
): NotificationPreferenceMap {
  const map = defaultPreferenceMap()

  for (const row of rows) {
    const category = row.type as NotificationCategory
    if (category in map) {
      map[category] = {
        inApp: row.in_app_enabled,
        email: row.email_enabled,
      }
    }
  }

  return map
}
