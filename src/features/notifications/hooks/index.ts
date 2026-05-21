"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  getNotificationsAction,
  getUnreadCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../api/actions"
import type { NotificationItem } from "../types"

export const NOTIFICATIONS_KEY = ["notifications", "list"] as const
export const UNREAD_KEY = ["notifications", "unread"] as const

export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsAction,
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

function useNotificationMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<void>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useMarkNotificationRead() {
  return useNotificationMutation<number>(async (notificationId) => {
    const result = await markNotificationReadAction(notificationId)
    if (!result.ok) throw new Error(result.error)
  })
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation<void>(async () => {
    const result = await markAllNotificationsReadAction()
    if (!result.ok) throw new Error(result.error)
  })
}

/**
 * Subscribe realtime cho notifications của user hiện tại. INSERT (mới đến) sẽ
 * refresh list + badge; UPDATE (read_at) cũng làm badge giảm tức thì. Hook này
 * mount một lần ở layout, sống suốt session — không cần polling.
 */
export function useRealtimeNotifications(currentUserId: number | null) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!currentUserId) return
    const supabase = createBrowserClient()
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
    }
    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, queryClient])
}
