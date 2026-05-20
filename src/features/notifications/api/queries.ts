import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { NotificationRow } from "@/types/database"

import type { NotificationItem, NotificationPayload } from "../types"

const LIST_LIMIT = 50

function toItem(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    payload: (row.payload as NotificationPayload | null) ?? null,
    isRead: row.read_at != null,
    createdAt: row.created_at,
  }
}

export async function loadNotifications(): Promise<NotificationItem[]> {
  const current = await getCurrentUser()
  if (!current) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, payload, read_at, created_at")
    .eq("user_id", current.appUser.id)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)

  return ((data ?? []) as NotificationRow[]).map(toItem)
}

export async function loadUnreadCount(): Promise<number> {
  const current = await getCurrentUser()
  if (!current) return 0

  const supabase = await createClient()
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", current.appUser.id)
    .is("read_at", null)

  return count ?? 0
}
