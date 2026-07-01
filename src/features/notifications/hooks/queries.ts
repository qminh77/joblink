"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getNotificationsAction,
  getUnreadCountAction,
} from "../api/actions"
import type { NotificationItem } from "../types"
import { NOTIFICATIONS_KEY, UNREAD_KEY } from "./keys"

export function useNotifications(initialData?: NotificationItem[]) {
  return useQuery<NotificationItem[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsAction,
    initialData,
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCountAction,
    staleTime: 30_000,
  })
}
