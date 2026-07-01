"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  loadMoreNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../api/actions"
import type { NotificationItem } from "../types"
import { NOTIFICATIONS_KEY, UNREAD_KEY } from "./keys"

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
      const prevList =
        queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      const prevUnread = queryClient.getQueryData<number>(UNREAD_KEY)

      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      )

      const wasUnread = prevList?.find(
        (item) => item.id === notificationId && !item.isRead,
      )
      if (wasUnread && prevUnread != null) {
        queryClient.setQueryData<number>(UNREAD_KEY, (old) =>
          Math.max(0, (old ?? 1) - 1),
        )
      }
      return { prevList, prevUnread }
    },
    onError: (error: Error, _, context) => {
      if (context?.prevList) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.prevList)
      }
      if (context?.prevUnread != null) {
        queryClient.setQueryData(UNREAD_KEY, context.prevUnread)
      }
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
      const prevList =
        queryClient.getQueryData<NotificationItem[]>(NOTIFICATIONS_KEY)
      const prevUnread = queryClient.getQueryData<number>(UNREAD_KEY)

      queryClient.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, (old) =>
        old?.map((item) => ({ ...item, isRead: true })),
      )
      queryClient.setQueryData<number>(UNREAD_KEY, 0)
      return { prevList, prevUnread }
    },
    onError: (error: Error, _, context) => {
      if (context?.prevList) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.prevList)
      }
      if (context?.prevUnread != null) {
        queryClient.setQueryData(UNREAD_KEY, context.prevUnread)
      }
      toast.error(error.message)
    },
  })
}
