"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import {
  loadMoreNotifications,
  loadNotifications,
  loadUnreadCount,
} from "./queries"
import { notificationTargetExists } from "../services/notification-command.service"
import type { NotificationItem } from "../types"

export async function getNotificationsAction(): Promise<NotificationItem[]> {
  await requireCurrentUser()
  return loadNotifications()
}

export async function loadMoreNotificationsAction(
  cursor: string,
): Promise<{ items: NotificationItem[]; hasMore: boolean }> {
  await requireCurrentUser()
  return loadMoreNotifications(cursor)
}

export async function getUnreadCountAction(): Promise<number> {
  await requireCurrentUser()
  return loadUnreadCount()
}

export async function verifyNotificationTargetAction(
  item: NotificationItem,
): Promise<boolean> {
  await requireCurrentUser()
  const supabase = await createClient()
  return notificationTargetExists(supabase, createAdminClient(), item)
}
