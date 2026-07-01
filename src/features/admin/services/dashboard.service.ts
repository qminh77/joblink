import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

import {
  listDashboardActorIdentityRows,
  loadDashboardSnapshot,
  type DashboardAuditRow,
} from "../data/dashboard.repo"
import type { AdminDashboardData, AdminRecentAction } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

const EMPTY: AdminDashboardData = {
  stats: {
    totalUsers: 0,
    newUsers7d: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingReports: 0,
    totalPosts: 0,
    totalConnections: 0,
  },
  roleDist: {},
  statusDist: {},
  verificationDist: {},
  recentActions: [],
}

type ActorIdentity = {
  id: number
  email: string
  displayName: string
}

export async function loadDashboardData(
  supabase: AdminSupabase,
): Promise<AdminDashboardData> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
    const snapshot = await loadDashboardSnapshot(supabase, sevenDaysAgo)
    const actorMap = await buildActorMap(supabase, snapshot.auditRows)

    return {
      stats: snapshot.stats,
      roleDist: snapshot.roleDist,
      statusDist: snapshot.statusDist,
      verificationDist: snapshot.verificationDist,
      recentActions: snapshot.auditRows.map((row) => mapRecentAction(row, actorMap)),
    }
  } catch (err) {
    console.error("[admin-dashboard]", err)
    return EMPTY
  }
}

async function buildActorMap(
  supabase: AdminSupabase,
  auditRows: DashboardAuditRow[],
) {
  const actorIds = [
    ...new Set(
      auditRows
        .map((row) => row.actor_id)
        .filter((value): value is number => typeof value === "number"),
    ),
  ]
  const { users, members, companies } = await listDashboardActorIdentityRows(
    supabase,
    actorIds,
  )
  const actorMap: Record<number, ActorIdentity> = {}

  for (const user of users) {
    actorMap[user.id] = {
      id: user.id,
      email: user.email,
      displayName: user.email,
    }
  }
  for (const member of members) {
    if (actorMap[member.user_id]) {
      actorMap[member.user_id].displayName = member.full_name
    }
  }
  for (const company of companies) {
    if (actorMap[company.user_id]) {
      actorMap[company.user_id].displayName = company.name
    }
  }

  return actorMap
}

function mapRecentAction(
  row: DashboardAuditRow,
  actorMap: Record<number, ActorIdentity>,
): AdminRecentAction {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason,
    createdAt: row.created_at,
    actor: row.actor_id != null ? (actorMap[row.actor_id] ?? null) : null,
  }
}
