"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import { CONNECTION_RELATION_KEY, NETWORK_OVERVIEW_KEY } from "./keys"

export function useRealtimeConnections(currentUserId: number | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!currentUserId) return

    const supabase = createBrowserClient()
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
      queryClient.invalidateQueries({ queryKey: CONNECTION_RELATION_KEY })
    }
    const channel = supabase
      .channel(`network-connections-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `requester_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        invalidate,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId, queryClient])
}
