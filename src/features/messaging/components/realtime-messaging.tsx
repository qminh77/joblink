"use client"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useRealtimeMessaging } from "../hooks"

/**
 * Mount một lần ở (main)/layout.tsx. Subscribe realtime cho messages của
 * user hiện tại để badge global + toast cập nhật mà không cần polling.
 */
export function RealtimeMessaging() {
  const user = useCurrentUser()
  useRealtimeMessaging({ currentUserId: user.id })
  return null
}
