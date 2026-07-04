import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { assertOk } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import {
  markAllNotificationsRead,
  markNotificationRead,
  verifyNotificationTarget,
} from "../data/notifications.repo"
import type { NotificationItem } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>
type AdminSupabase = ReturnType<typeof createAdminClient>

export async function markOneNotificationRead(
  supabase: Supabase,
  userId: number,
  notificationId: number,
): Promise<void> {
  assertOk(
    await markNotificationRead(supabase, notificationId, userId),
    "unexpected",
  )
}

export async function markEveryNotificationRead(
  supabase: Supabase,
  userId: number,
): Promise<void> {
  assertOk(await markAllNotificationsRead(supabase, userId), "unexpected")
}

export function notificationTargetExists(
  supabase: Supabase,
  admin: AdminSupabase,
  item: NotificationItem,
): Promise<boolean> {
  return verifyNotificationTarget(supabase, admin, item)
}
