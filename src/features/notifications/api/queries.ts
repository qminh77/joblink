import "server-only"

// SRS UC Trace - M07 UC-53 Xem thong bao va so thong bao chua doc.
// Flow: notifications page/dropdown -> server query/action -> notifications repo -> paged notification data.

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type { NotificationRow } from "@/types/database"

import type { NotificationItem, NotificationPayload } from "../types"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

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
    .select("id, type, payload, read_at, created_at")
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

export async function loadNotificationsPageData(): Promise<{
  items: NotificationItem[]
  unreadCount: number
  hasMore: boolean
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("user_id", current.appUser.id)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT + 1)

  const items = ((data ?? []) as NotificationRow[]).map(toItem)
  const hasMore = items.length > LIST_LIMIT
  if (hasMore) items.pop()

  return {
    items,
    unreadCount: items.filter((i) => !i.isRead).length,
    hasMore,
  }
}

export async function loadMoreNotifications(
  cursor: string,
): Promise<{
  items: NotificationItem[]
  hasMore: boolean
}> {
  const current = await getCurrentUser()
  if (!current) return { items: [], hasMore: false }

  const supabase = await createClient()
  const { data } = await supabase
    .from("notifications")
    .select("id, type, payload, read_at, created_at")
    .eq("user_id", current.appUser.id)
    .order("created_at", { ascending: false })
    .lt("created_at", cursor)
    .limit(LIST_LIMIT + 1)

  const items = ((data ?? []) as NotificationRow[]).map(toItem)
  const hasMore = items.length > LIST_LIMIT
  if (hasMore) items.pop()

  return { items, hasMore }
}
