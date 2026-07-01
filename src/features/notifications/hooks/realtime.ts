"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { createClient as createBrowserClient } from "@/lib/supabase/client"
import { NOTIFICATIONS_KEY, UNREAD_KEY } from "./keys"

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
