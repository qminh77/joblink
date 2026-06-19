"use client"

import { useQuery } from "@tanstack/react-query"

import {
  getBlockStatusAction,
  getConnectionRelationAction,
  getNetworkOverviewAction,
  listBlockedUsersAction,
} from "../api/actions"
import type {
  BlockStatus,
  BlockedUserItem,
  ConnectionRelation,
  NetworkOverview,
} from "../types"
import {
  BLOCK_STATUS_KEY,
  BLOCKED_USERS_KEY,
  CONNECTION_RELATION_KEY,
  NETWORK_OVERVIEW_KEY,
  SENT_IDS_KEY,
} from "./keys"

export function useNetworkOverview(initialData?: NetworkOverview) {
  return useQuery<NetworkOverview>({
    queryKey: NETWORK_OVERVIEW_KEY,
    queryFn: getNetworkOverviewAction,
    initialData,
    staleTime: 30_000,
  })
}

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

export function useBlockStatus(targetUserId: number, initialData?: BlockStatus) {
  return useQuery<BlockStatus>({
    queryKey: [...BLOCK_STATUS_KEY, targetUserId],
    queryFn: () => getBlockStatusAction(targetUserId),
    initialData,
    staleTime: 30_000,
  })
}

export function useBlockedUsers(initialData?: BlockedUserItem[]) {
  return useQuery<BlockedUserItem[]>({
    queryKey: BLOCKED_USERS_KEY,
    queryFn: listBlockedUsersAction,
    initialData,
    staleTime: 30_000,
  })
}
