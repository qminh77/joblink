import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { USER_ROLES, USER_STATUSES } from "@/features/auth/lib/constants"
import {
  COMPANY_VERIFICATION_STATUSES,
} from "@/features/companies/lib/constants"

type AdminSupabase = ReturnType<typeof createAdminClient>

type LooseClient = {
  from: (t: string) => {
    select: (
      col: string,
      opts?: { count?: "exact"; head?: boolean },
    ) => LooseBuilder
  }
}

type LooseBuilder = Promise<{ data: unknown; count: number | null }> & {
  is(col: string, v: null): LooseBuilder
  eq(col: string, v: unknown): LooseBuilder
  in(col: string, v: unknown[]): LooseBuilder
  gte(col: string, v: string): LooseBuilder
  order(col: string, opts: { ascending: boolean }): LooseBuilder
  limit(n: number): LooseBuilder
}

export type DashboardAuditRow = {
  id: number
  action: string
  entity_type: string | null
  entity_id: number | null
  reason: string | null
  created_at: string
  actor_id: number | null
}

export type DashboardActorUserRow = {
  id: number
  email: string
}

export type DashboardActorMemberRow = {
  user_id: number
  full_name: string
}

export type DashboardActorCompanyRow = {
  user_id: number
  name: string
}

async function countOf(
  supabase: LooseClient,
  table: string,
  filter: (q: LooseBuilder) => LooseBuilder,
): Promise<number> {
  const q = supabase.from(table).select("id", { count: "exact", head: true })
  const res = await filter(q as LooseBuilder)
  return res.count ?? 0
}

// Count groups with head:true queries so dashboard bandwidth stays constant.
async function distOf<K extends string>(
  supabase: LooseClient,
  table: string,
  column: string,
  values: readonly K[],
  base: (q: LooseBuilder) => LooseBuilder,
): Promise<Partial<Record<K, number>>> {
  const entries = await Promise.all(
    values.map(
      async (v) =>
        [
          v,
          await countOf(supabase, table, (q) => base(q).eq(column, v)),
        ] as const,
    ),
  )
  const out: Partial<Record<K, number>> = {}
  for (const [k, n] of entries) if (n > 0) out[k] = n
  return out
}

export async function loadDashboardSnapshot(
  supabase: AdminSupabase,
  sevenDaysAgo: string,
) {
  const loose = supabase as unknown as LooseClient
  const [
    totalUsers,
    newUsers7d,
    totalCompanies,
    pendingCompanies,
    totalJobs,
    activeJobs,
    totalApplications,
    pendingReports,
    totalPosts,
    totalConnections,
    roleDist,
    statusDist,
    verificationDist,
    auditRows,
  ] = await Promise.all([
    countOf(loose, "users", (q) => q.is("deleted_at", null)),
    countOf(loose, "users", (q) =>
      q.is("deleted_at", null).gte("created_at", sevenDaysAgo),
    ),
    countOf(loose, "users", (q) =>
      q.eq("role", "company").is("deleted_at", null),
    ),
    countOf(loose, "company_profiles", (q) =>
      q
        .in("verification_status", ["pending", "pending_update"])
        .is("deleted_at", null),
    ),
    countOf(loose, "jobs", (q) => q.is("deleted_at", null)),
    countOf(loose, "jobs", (q) =>
      q.eq("status", "active").is("deleted_at", null),
    ),
    countOf(loose, "job_applications", (q) => q),
    countOf(loose, "reports", (q) =>
      q.in("status", ["pending", "in_review"]),
    ),
    countOf(loose, "posts", (q) =>
      q.is("deleted_at", null).eq("status", "active"),
    ),
    countOf(loose, "connections", (q) => q.eq("status", "accepted")),
    distOf(loose, "users", "role", USER_ROLES, (q) =>
      q.is("deleted_at", null),
    ),
    distOf(loose, "users", "status", USER_STATUSES, (q) =>
      q.is("deleted_at", null),
    ),
    distOf(
      loose,
      "company_profiles",
      "verification_status",
      COMPANY_VERIFICATION_STATUSES,
      (q) => q.is("deleted_at", null),
    ),
    loose
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, reason, created_at, actor_id")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return {
    stats: {
      totalUsers,
      newUsers7d,
      totalCompanies,
      pendingCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      pendingReports,
      totalPosts,
      totalConnections,
    },
    roleDist,
    statusDist,
    verificationDist,
    auditRows: (auditRows.data ?? []) as DashboardAuditRow[],
  }
}

export async function listDashboardActorIdentityRows(
  supabase: AdminSupabase,
  actorIds: number[],
) {
  if (actorIds.length === 0) {
    return { users: [], members: [], companies: [] }
  }

  const [{ data: users }, { data: members }, { data: companies }] =
    await Promise.all([
      supabase.from("users").select("id, email").in("id", actorIds),
      supabase
        .from("member_profiles")
        .select("user_id, full_name")
        .in("user_id", actorIds)
        .is("deleted_at", null),
      supabase
        .from("company_profiles")
        .select("user_id, name")
        .in("user_id", actorIds)
        .is("deleted_at", null),
    ])

  return {
    users: (users ?? []) as DashboardActorUserRow[],
    members: (members ?? []) as DashboardActorMemberRow[],
    companies: (companies ?? []) as DashboardActorCompanyRow[],
  }
}
