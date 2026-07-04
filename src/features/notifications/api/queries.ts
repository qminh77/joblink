import "server-only"

// SRS UC Trace - M07 UC-53 Xem thong bao va so thong bao chua doc.
// Flow: notifications page/dropdown -> server query/action -> notification service -> notification repo.

import {
  getCurrentUser,
  requireCurrentUser,
} from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  countUnreadNotifications,
  loadNotificationItems,
  loadNotificationsPage,
} from "../services/notification-read.service"
import type { NotificationItem } from "../types"

export async function loadNotifications(): Promise<NotificationItem[]> {
  const current = await getCurrentUser()
  if (!current) return []

  const supabase = await createClient()
  const { items } = await loadNotificationItems(supabase, current.appUser.id)
  return items
}

export async function loadUnreadCount(): Promise<number> {
  const current = await getCurrentUser()
  if (!current) return 0

  const supabase = await createClient()
  return countUnreadNotifications(supabase, current.appUser.id)
}

export async function loadNotificationsPageData(): Promise<{
  items: NotificationItem[]
  unreadCount: number
  hasMore: boolean
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  return loadNotificationsPage(supabase, current.appUser.id)
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
  return loadNotificationItems(supabase, current.appUser.id, { cursor })
}
