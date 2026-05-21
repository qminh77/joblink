"use client"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useRealtimeNotifications } from "../hooks"

/**
 * Đặt một lần trong layout đã có CurrentUserProvider. Subscribe realtime cho
 * notifications + giữ badge unread đồng bộ tức thì giữa các tab/devices.
 */
export function RealtimeNotifications() {
  const user = useCurrentUser()
  useRealtimeNotifications(user.id)
  return null
}
