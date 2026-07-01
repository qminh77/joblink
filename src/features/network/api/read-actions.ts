"use server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import type { ConnectionRelation, NetworkOverview } from "../types"
import { loadConnectionRelation, loadNetworkOverview } from "./queries"

export async function getNetworkOverviewAction(): Promise<NetworkOverview> {
  await requireCurrentUser()
  return loadNetworkOverview()
}

export async function getConnectionRelationAction(
  targetUserId: number,
): Promise<ConnectionRelation> {
  await requireCurrentUser()
  return loadConnectionRelation(targetUserId)
}
