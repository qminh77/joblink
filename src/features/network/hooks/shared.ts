import type { QueryClient } from "@tanstack/react-query"

import type { NetworkOverview } from "../types"
import {
  CONNECTION_RELATION_KEY,
  NETWORK_OVERVIEW_KEY,
  SENT_IDS_KEY,
} from "./keys"

export type ActionResult = { ok: true } | { ok: false; error: string }
export type OverviewSnapshot = NetworkOverview | undefined

export async function run<TArgs>(
  action: (args: TArgs) => Promise<ActionResult>,
  args: TArgs,
) {
  const result = await action(args)
  if (!result.ok) throw new Error(result.error)
}

export function mutateSentIds(
  qc: QueryClient,
  updater: (prev: Set<number>) => Set<number>,
) {
  qc.setQueryData<Set<number>>(SENT_IDS_KEY, (prev) =>
    updater(prev ?? new Set<number>()),
  )
}

export function invalidateAfter(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
  qc.invalidateQueries({ queryKey: CONNECTION_RELATION_KEY })
  qc.invalidateQueries({ queryKey: ["notifications"] })
  qc.invalidateQueries({ queryKey: ["home", "stats"] })
}

export async function snapshotOverview(
  qc: QueryClient,
): Promise<OverviewSnapshot> {
  await qc.cancelQueries({ queryKey: NETWORK_OVERVIEW_KEY })
  return qc.getQueryData<NetworkOverview>(NETWORK_OVERVIEW_KEY)
}

export function restoreOverview(
  qc: QueryClient,
  snapshot: OverviewSnapshot,
) {
  if (snapshot) qc.setQueryData(NETWORK_OVERVIEW_KEY, snapshot)
}

export function setOverview(
  qc: QueryClient,
  updater: (prev: NetworkOverview) => NetworkOverview,
) {
  qc.setQueryData<NetworkOverview>(NETWORK_OVERVIEW_KEY, (prev) =>
    prev ? updater(prev) : prev,
  )
}
