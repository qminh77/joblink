"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  blockUserAction,
  cancelConnectionRequestAction,
  removeConnectionAction,
  respondConnectionRequestAction,
  sendConnectionRequestAction,
  unblockUserAction,
} from "../api/actions"
import type { BlockStatus, BlockedUserItem, ConnectionItem } from "../types"
import {
  BLOCK_STATUS_KEY,
  BLOCKED_USERS_KEY,
  CONNECTION_RELATION_KEY,
} from "./keys"
import {
  invalidateAfter,
  mutateSentIds,
  restoreOverview,
  run,
  setOverview,
  snapshotOverview,
  type OverviewSnapshot,
} from "./shared"

export function useSendConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<
    void,
    Error,
    number,
    { snapshot: OverviewSnapshot; targetUserId: number }
  >({
    mutationFn: (targetUserId) =>
      run(sendConnectionRequestAction, targetUserId),
    onMutate: async (targetUserId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        suggestions: prev.suggestions.filter(
          (suggestion) => suggestion.userId !== targetUserId,
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

export function useCancelConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<
    void,
    Error,
    number,
    { snapshot: OverviewSnapshot; userId?: number }
  >({
    mutationFn: (connectionId) =>
      run(cancelConnectionRequestAction, connectionId),
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      const userId = snapshot?.outgoing.find(
        (item) => item.connectionId === connectionId,
      )?.userId
      setOverview(qc, (prev) => ({
        ...prev,
        outgoing: prev.outgoing.filter(
          (item) => item.connectionId !== connectionId,
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

export function useAcceptConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: OverviewSnapshot }>({
    mutationFn: async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, true)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => {
        const target = prev.incoming.find(
          (item) => item.connectionId === connectionId,
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
            (item) => item.connectionId !== connectionId,
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

export function useRejectConnectionRequest() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: OverviewSnapshot }>({
    mutationFn: async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, false)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        incoming: prev.incoming.filter(
          (item) => item.connectionId !== connectionId,
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

export function useRemoveConnection() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot: OverviewSnapshot }>({
    mutationFn: (connectionId) => run(removeConnectionAction, connectionId),
    onMutate: async (connectionId) => {
      const snapshot = await snapshotOverview(qc)
      setOverview(qc, (prev) => ({
        ...prev,
        connections: prev.connections.filter(
          (item) => item.connectionId !== connectionId,
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

export function useBlockUser() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number>({
    mutationFn: (targetUserId) => run(blockUserAction, targetUserId),
    onSuccess: (_data, targetUserId) => {
      qc.setQueryData<BlockStatus>([...BLOCK_STATUS_KEY, targetUserId], {
        blockedByMe: true,
      })
      toast.success(t("blocked"))
    },
    onError: (error) => toast.error(error.message),
    onSettled: (_data, _error, targetUserId) => {
      invalidateAfter(qc)
      qc.invalidateQueries({ queryKey: BLOCKED_USERS_KEY })
      qc.invalidateQueries({ queryKey: [...BLOCK_STATUS_KEY, targetUserId] })
      qc.invalidateQueries({
        queryKey: [...CONNECTION_RELATION_KEY, targetUserId],
      })
    },
  })
}

export function useUnblockUser() {
  const qc = useQueryClient()
  const t = useTranslations("network.toast")
  return useMutation<void, Error, number, { snapshot?: BlockedUserItem[] }>({
    mutationFn: (targetUserId) => run(unblockUserAction, targetUserId),
    onMutate: async (targetUserId) => {
      await qc.cancelQueries({ queryKey: BLOCKED_USERS_KEY })
      const snapshot = qc.getQueryData<BlockedUserItem[]>(BLOCKED_USERS_KEY)
      qc.setQueryData<BlockedUserItem[]>(BLOCKED_USERS_KEY, (prev) =>
        (prev ?? []).filter((user) => user.userId !== targetUserId),
      )
      return { snapshot }
    },
    onError: (error, _targetUserId, context) => {
      if (context?.snapshot) {
        qc.setQueryData(BLOCKED_USERS_KEY, context.snapshot)
      }
      toast.error(error.message)
    },
    onSuccess: (_data, targetUserId) => {
      qc.setQueryData<BlockStatus>([...BLOCK_STATUS_KEY, targetUserId], {
        blockedByMe: false,
      })
      toast.success(t("unblocked"))
    },
    onSettled: (_data, _error, targetUserId) => {
      qc.invalidateQueries({ queryKey: BLOCKED_USERS_KEY })
      qc.invalidateQueries({ queryKey: [...BLOCK_STATUS_KEY, targetUserId] })
    },
  })
}
