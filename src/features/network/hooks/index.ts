"use client"

import { useEffect } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createClient as createBrowserClient } from "@/lib/supabase/client"

import {
  cancelConnectionRequestAction,
  getConnectionRelationAction,
  getNetworkOverviewAction,
  removeConnectionAction,
  respondConnectionRequestAction,
  sendConnectionRequestAction,
} from "../api/actions"
import type { ConnectionItem, ConnectionRelation, NetworkOverview } from "../types"

export const NETWORK_OVERVIEW_KEY = ["network", "overview"] as const
export const CONNECTION_RELATION_KEY = ["network", "relation"] as const
const SENT_IDS_KEY = ["network", "sent-ids"] as const

type ActionResult = { ok: true } | { ok: false; error: string }

async function run<TArgs>(
  action: (args: TArgs) => Promise<ActionResult>,
  args: TArgs,
) {
  const result = await action(args)
  if (!result.ok) throw new Error(result.error)
}

// ---------------------------------------------------------------------------
// Overview query (SSR-hydrated)
// ---------------------------------------------------------------------------
export function useNetworkOverview(initialData?: NetworkOverview) {
  return useQuery<NetworkOverview>({
    queryKey: NETWORK_OVERVIEW_KEY,
    queryFn: getNetworkOverviewAction,
    initialData,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// Quan hệ kết nối giữa viewer ↔ target (dùng cho ConnectButton trên profile).
// SSR truyền initial xuống; sau mutation hoặc realtime, invalidate để refetch.
// ---------------------------------------------------------------------------
export function useConnectionRelation(
  targetUserId: number,
  initialData?: ConnectionRelation,
) {
  return useQuery<ConnectionRelation>({
    queryKey: [...CONNECTION_RELATION_KEY, targetUserId],
    queryFn: () => getConnectionRelationAction(targetUserId),
    initialData,
    staleTime: 30_000,
  })
}

// ---------------------------------------------------------------------------
// "Đã gửi" Set — chia sẻ giữa /home và /network. Sống trong react-query
// cache để mọi component subscribe đều re-render khi đổi.
// ---------------------------------------------------------------------------
export function useSentConnectionIds(): Set<number> {
  const { data } = useQuery<Set<number>>({
    queryKey: SENT_IDS_KEY,
    queryFn: () => new Set<number>(),
    initialData: new Set<number>(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  return data ?? new Set<number>()
}

function mutateSentIds(
  qc: QueryClient,
  updater: (prev: Set<number>) => Set<number>,
) {
  qc.setQueryData<Set<number>>(SENT_IDS_KEY, (prev) =>
    updater(prev ?? new Set<number>()),
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function invalidateAfter(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
  qc.invalidateQueries({ queryKey: CONNECTION_RELATION_KEY })
  qc.invalidateQueries({ queryKey: ["notifications"] })
  qc.invalidateQueries({ queryKey: ["home", "stats"] })
}

type Snapshot = NetworkOverview | undefined

async function snapshotOverview(qc: QueryClient): Promise<Snapshot> {
  await qc.cancelQueries({ queryKey: NETWORK_OVERVIEW_KEY })
  return qc.getQueryData<NetworkOverview>(NETWORK_OVERVIEW_KEY)
}

function restoreOverview(qc: QueryClient, snapshot: Snapshot) {
  if (snapshot) qc.setQueryData(NETWORK_OVERVIEW_KEY, snapshot)
}

function setOverview(
  qc: QueryClient,
  updater: (prev: NetworkOverview) => NetworkOverview,
) {
  qc.setQueryData<NetworkOverview>(NETWORK_OVERVIEW_KEY, (prev) =>
    prev ? updater(prev) : prev,
  )
}

// ---------------------------------------------------------------------------
// Send invitation — optimistic remove from suggestions + mark sent
// ---------------------------------------------------------------------------
export function useSendConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<
    void,
    Error,
    number,
    { snapshot: Snapshot; targetUserId: number }
  >({
    mutationFn: (targetUserId) =>
      run(sendConnectionRequestAction, targetUserId),
    onMutate: async (targetUserId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter(
          (s) => s.userId !== targetUserId,
        ),
      }))
      mutateSentIds(qc, (prev) => {
        const next = new Set(prev)
        next.add(targetUserId)
        return next
      })
      return { snapshot, targetUserId }
    },
    onError: (error, _targetUserId, context) => {
      if (context) {
        restoreOverview(qc, context.snapshot)
        mutateSentIds(qc, (prev) => {
          const next = new Set(prev)
          next.delete(context.targetUserId)
          return next
        })
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("sent"))
    },
    onSettled: () => invalidateAfter(qc),
  })
}

// ---------------------------------------------------------------------------
// Cancel outgoing invitation — remove from outgoing, drop from sentIds
// ---------------------------------------------------------------------------
export function useCancelConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<
    void,
    Error,
    number,
    { snapshot: Snapshot; userId?: number }
  >({
    mutationFn: (connectionId) =>
      run(cancelConnectionRequestAction, connectionId),
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      const userId = snapshot?.outgoing.find(
        (i) => i.connectionId === connectionId,
      )?.userId
      setOverview(qc, (prev) => ({
        ...prev,
        outgoing: prev.outgoing.filter(
          (i) => i.connectionId !== connectionId,
        ),
      }))
      if (userId != null) {
        mutateSentIds(qc, (prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
      return { snapshot, userId }
    },
    onError: (error, _id, context) => {
      if (context) restoreOverview(qc, context.snapshot)
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("canceled"))
    },
    onSettled: () => invalidateAfter(qc),
  })
}

// ---------------------------------------------------------------------------
// Accept incoming — move incoming → connections
// ---------------------------------------------------------------------------
export function useAcceptConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: Snapshot }>({
    mutationFn: async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, true)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => {
        const target = prev.incoming.find(
          (i) => i.connectionId === connectionId,
        )
        if (!target) return prev
        const newConnection: ConnectionItem = {
          userId: target.userId,
          role: target.role,
          displayName: target.displayName,
          avatarUrl: target.avatarUrl,
          headline: target.headline,
          location: target.location,
          connectionId: target.connectionId,
          connectedAt: new Date().toISOString(),
        }
        return {
          ...prev,
          incoming: prev.incoming.filter(
            (i) => i.connectionId !== connectionId,
          ),
          connections: [newConnection, ...prev.connections],
        }
      })
      return { snapshot }
    },
    onError: (error, _id, context) => {
      if (context) restoreOverview(qc, context.snapshot)
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("accepted"))
    },
    onSettled: () => invalidateAfter(qc),
  })
}

// ---------------------------------------------------------------------------
// Reject incoming — drop from incoming
// ---------------------------------------------------------------------------
export function useRejectConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: Snapshot }>({
    mutationFn: async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, false)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        incoming: prev.incoming.filter(
          (i) => i.connectionId !== connectionId,
        ),
      }))
      return { snapshot }
    },
    onError: (error, _id, context) => {
      if (context) restoreOverview(qc, context.snapshot)
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("rejected"))
    },
    onSettled: () => invalidateAfter(qc),
  })
}

// ---------------------------------------------------------------------------
// Remove existing connection — drop from connections
// ---------------------------------------------------------------------------
export function useRemoveConnection() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: Snapshot }>({
    mutationFn: (connectionId) =>
      run(removeConnectionAction, connectionId),
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        connections: prev.connections.filter(
          (i) => i.connectionId !== connectionId,
        ),
      }))
      return { snapshot }
    },
    onError: (error, _id, context) => {
      if (context) restoreOverview(qc, context.snapshot)
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("removed"))
    },
    onSettled: () => invalidateAfter(qc),
  })
}

// ---------------------------------------------------------------------------
// Realtime — connections changes liên quan tới me invalidate overview cache
// ---------------------------------------------------------------------------
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
