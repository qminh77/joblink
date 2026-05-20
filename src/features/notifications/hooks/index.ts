"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getNotificationsAction,
  getUnreadCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../api/actions"

const NOTIFICATIONS_KEY = ["notifications", "list"] as const
const UNREAD_KEY = ["notifications", "unread"] as const

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsAction,
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCountAction,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const result = await markNotificationReadAction(notificationId)
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsReadAction()
      if (!result.ok) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY })
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
