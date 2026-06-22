"use client"

import { useCallback, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  getNotificationPreferencesAction,
  getNotificationsAction,
  getUnreadCountAction,
  loadMoreNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferenceAction,
} from "../api/actions"
import type { NotificationPreferenceMap } from "../lib/preferences"
import type { UpdateNotificationPreferenceInput } from "../schemas"
import type { NotificationItem } from "../types"

export const NOTIFICATIONS_KEY = ["notifications", "list"] as const
export const UNREAD_KEY = ["notifications", "unread"] as const
export const NOTIFICATION_PREFS_KEY = ["notifications", "preferences"] as const

export function useNotifications(initialData?: NotificationItem[]) {
  return useQuery<NotificationItem[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsAction,
    initialData: initialData,
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

export function useLoadMoreNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: loadMoreNotificationsAction,
    onSuccess: (result) => {
      queryClient.setQueryData<NotificationItem[]>(
        NOTIFICATIONS_KEY,
        (prev) => [...(prev ?? []), ...result.items],
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const result = await markNotificationReadAction(notificationId)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      await queryClient.cancelQueries({ queryKey: UNREAD_KEY })
      const prevList = queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      const prevUnread = queryClient.getQueryData<number>(UNREAD_KEY)

      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      
      const wasUnread = prevList?.find((n) => n.id === notificationId && !n.isRead)
      if (wasUnread && prevUnread != null) {
        queryClient.setQueryData<number>(UNREAD_KEY, (old) => Math.max(0, (old ?? 1) - 1))
      }
      return { prevList, prevUnread }
    },
    onError: (error: Error, _, context) => {
      if (context?.prevList) queryClient.setQueryData(NOTIFICATIONS_KEY, context.prevList)
      if (context?.prevUnread != null) queryClient.setQueryData(UNREAD_KEY, context.prevUnread)
      toast.error(error.message)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsReadAction()
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      await queryClient.cancelQueries({ queryKey: UNREAD_KEY })
      const prevList = queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      const prevUnread = queryClient.getQueryData<number>(UNREAD_KEY)

      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((n) => ({ ...n, isRead: true })),
      )
      queryClient.setQueryData<number>(UNREAD_KEY, 0)
      return { prevList, prevUnread }
    },
    onError: (error: Error, _, context) => {
      if (context?.prevList) queryClient.setQueryData(NOTIFICATIONS_KEY, context.prevList)
      if (context?.prevUnread != null) queryClient.setQueryData(UNREAD_KEY, context.prevUnread)
      toast.error(error.message)
    },
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

// ---------------------------------------------------------------------------
// Preferences (UC-65)
// ---------------------------------------------------------------------------

export function useNotificationPreferences() {
  return useQuery<NotificationPreferenceMap>({
    queryKey: NOTIFICATION_PREFS_KEY,
    queryFn: getNotificationPreferencesAction,
    staleTime: 60_000,
  })
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient()
  const t = useTranslations("settings.notifications")
  return useMutation<
    void,
    Error,
    UpdateNotificationPreferenceInput,
    { snapshot?: NotificationPreferenceMap }
  >({
    mutationFn: async (input) => {
      const result = await updateNotificationPreferenceAction(input)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFS_KEY })
      const snapshot = queryClient.getQueryData<NotificationPreferenceMap>(
        NOTIFICATION_PREFS_KEY,
      )
      queryClient.setQueryData<NotificationPreferenceMap>(
        NOTIFICATION_PREFS_KEY,
        (prev) =>
          prev
            ? { ...prev, [input.category]: { inApp: input.inApp, email: input.email } }
            : prev,
      )
      return { snapshot }
    },
    onError: (error, _input, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(NOTIFICATION_PREFS_KEY, context.snapshot)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success(t("saved")),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFS_KEY }),
  })
}
