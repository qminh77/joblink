"use client"

import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  cancelConnectionRequestAction,
  getNetworkOverviewAction,
  removeConnectionAction,
  respondConnectionRequestAction,
  sendConnectionRequestAction,
} from "../api/actions"
import type { NetworkOverview } from "../types"

export const NETWORK_OVERVIEW_KEY = ["network", "overview"] as const

type ActionResult = { ok: true } | { ok: false; error: string }

async function run<TArgs>(
  action: (args: TArgs) => Promise<ActionResult>,
  args: TArgs,
) {
  const result = await action(args)
  if (!result.ok) throw new Error(result.error)
}

export function useNetworkOverview(initialData?: NetworkOverview) {
  return useQuery<NetworkOverview>({
    queryKey: NETWORK_OVERVIEW_KEY,
    queryFn: getNetworkOverviewAction,
    initialData,
    staleTime: 30_000,
  })
}

type SuccessKey = "sent" | "canceled" | "accepted" | "rejected" | "removed"

function useNetworkMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<void>,
  successKey: SuccessKey,
) {
  const queryClient = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey))
      queryClient.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
      // Connection actions also touch notifications (insert/update) và
      // counter cache (connection_count) — invalidate cả hai để UI đồng bộ.
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["home", "stats"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSendConnectionRequest() {
  return useNetworkMutation<number>(
    (targetUserId) => run(sendConnectionRequestAction, targetUserId),
    "sent",
  )
}

export function useCancelConnectionRequest() {
  return useNetworkMutation<number>(
    (connectionId) => run(cancelConnectionRequestAction, connectionId),
    "canceled",
  )
}

export function useAcceptConnectionRequest() {
  return useNetworkMutation<number>(
    async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, true)
      if (!result.ok) throw new Error(result.error)
    },
    "accepted",
  )
}

export function useRejectConnectionRequest() {
  return useNetworkMutation<number>(
    async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, false)
      if (!result.ok) throw new Error(result.error)
    },
    "rejected",
  )
}

export function useRemoveConnection() {
  return useNetworkMutation<number>(
    (connectionId) => run(removeConnectionAction, connectionId),
    "removed",
  )
}

/**
 * Subscribe realtime cho connections liên quan tới currentUserId. Mọi INSERT/
 * UPDATE/DELETE (gửi/chấp nhận/huỷ/xoá kết nối) sẽ invalidate overview để client
 * pull lại danh sách qua RPC duy nhất.
 */
export function useRealtimeConnections(currentUserId: number | null) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!currentUserId) return
    const supabase = createBrowserClient()
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
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
