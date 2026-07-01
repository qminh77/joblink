"use server"

import { requirePermission } from "@/lib/rbac"

import type { ConnectionRelation, NetworkOverview } from "../types"
import { loadConnectionRelation, loadNetworkOverview } from "./queries"

export async function getNetworkOverviewAction(): Promise<NetworkOverview> {
  await requirePermission("network.view")
  return loadNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: number,
): Promise<ConnectionRelation> {
  await requirePermission("network.view")
  return loadConnectionRelation(targetUserId)
}
