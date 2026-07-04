import "server-only"

import type { createClient } from "@/lib/supabase/server"

import {
  countUnreadNotificationRows,
  listNotificationRows,
  type NotificationRecord,
} from "../data/notifications.repo"
import type { NotificationItem, NotificationPayload } from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

const LIST_LIMIT = 50

function limitWithLookahead(limit = LIST_LIMIT) {
  return Math.min(100, Math.max(1, limit)) + 1
}

export function mapNotificationItem(row: NotificationRecord): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    payload: (row.payload as NotificationPayload | null) ?? null,
    isRead: row.read_at != null,
    createdAt: row.created_at,
  }
}

export async function loadNotificationItems(
  supabase: Supabase,
  userId: number,
  params: { cursor?: string | null; limit?: number } = {},
): Promise<{ items: NotificationItem[]; hasMore: boolean }> {
  const limit = params.limit ?? LIST_LIMIT
  const { data } = await listNotificationRows(supabase, userId, {
    cursor: params.cursor ?? null,
    limit: limitWithLookahead(limit),
  })

  const items = ((data ?? []) as NotificationRecord[]).map(mapNotificationItem)
  const hasMore = items.length > limit
  if (hasMore) items.pop()

  return { items, hasMore }
}

export async function countUnreadNotifications(
  supabase: Supabase,
  userId: number,
): Promise<number> {
  const { count } = await countUnreadNotificationRows(supabase, userId)
  return count ?? 0
}

export async function loadNotificationsPage(
  supabase: Supabase,
  userId: number,
): Promise<{
  items: NotificationItem[]
  unreadCount: number
  hasMore: boolean
}> {
  const [page, unreadCount] = await Promise.all([
    loadNotificationItems(supabase, userId),
    countUnreadNotifications(supabase, userId),
  ])

  return {
    ...page,
    unreadCount,
  }
}
