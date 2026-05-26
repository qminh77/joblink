import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { CompanyVerification } from "@/types/database"
import type { UserRole, UserStatus } from "@/lib/constants"

import { requireAdmin } from "./admin-guard"
import type { AdminDashboardData, AdminRecentAction } from "../types"

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

async function countOf(
  supabase: LooseClient,
  table: string,
  filter: (q: LooseBuilder) => LooseBuilder,
): Promise<number> {
  const q = supabase.from(table).select("id", { count: "exact", head: true })
  const res = await filter(q as LooseBuilder)
  return res.count ?? 0
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  await requireAdmin()
  const supabase = createAdminClient() as unknown as LooseClient
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()

  try {
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
      roleRows,
      statusRows,
      verifRows,
      auditRows,
    ] = await Promise.all([
      countOf(supabase, "users", (q) => q.is("deleted_at", null)),
      countOf(supabase, "users", (q) =>
        q.is("deleted_at", null).gte("created_at", sevenDaysAgo),
      ),
      countOf(supabase, "users", (q) =>
        q.eq("role", "company").is("deleted_at", null),
      ),
      countOf(supabase, "company_profiles", (q) =>
        q
          .in("verification_status", ["pending", "pending_update"])
          .is("deleted_at", null),
      ),
      countOf(supabase, "jobs", (q) => q.is("deleted_at", null)),
      countOf(supabase, "jobs", (q) =>
        q.eq("status", "active").is("deleted_at", null),
      ),
      countOf(supabase, "job_applications", (q) => q),
      countOf(supabase, "reports", (q) =>
        q.in("status", ["pending", "in_review"]),
      ),
      countOf(supabase, "posts", (q) =>
        q.is("deleted_at", null).eq("status", "active"),
      ),
      countOf(supabase, "connections", (q) => q.eq("status", "accepted")),
      supabase.from("users").select("role").is("deleted_at", null),
      supabase.from("users").select("status").is("deleted_at", null),
      supabase
        .from("company_profiles")
        .select("verification_status")
        .is("deleted_at", null),
      supabase
        .from("audit_logs")
        .select(
          "id, action, entity_type, entity_id, reason, created_at, actor_id",
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ])

    const roleDist: Partial<Record<UserRole, number>> = {}
    for (const r of (roleRows.data ?? []) as Array<{ role: UserRole }>) {
      roleDist[r.role] = (roleDist[r.role] ?? 0) + 1
    }
    const statusDist: Partial<Record<UserStatus, number>> = {}
    for (const r of (statusRows.data ?? []) as Array<{ status: UserStatus }>) {
      statusDist[r.status] = (statusDist[r.status] ?? 0) + 1
    }
    const verificationDist: Partial<Record<CompanyVerification, number>> = {}
    for (const r of (verifRows.data ?? []) as Array<{
      verification_status: CompanyVerification
    }>) {
      verificationDist[r.verification_status] =
        (verificationDist[r.verification_status] ?? 0) + 1
    }

    const auditList = (auditRows.data ?? []) as Array<{
      id: number
      action: string
      entity_type: string | null
      entity_id: number | null
      reason: string | null
      created_at: string
      actor_id: number | null
    }>
    const actorIds = [
      ...new Set(
        auditList
          .map((a) => a.actor_id)
          .filter((v): v is number => typeof v === "number"),
      ),
    ]

    const actorMap: Record<
      number,
      { id: number; email: string; displayName: string }
    > = {}
    if (actorIds.length > 0) {
      const realClient = createAdminClient()
      const [{ data: users }, { data: members }, { data: companies }] =
        await Promise.all([
          realClient.from("users").select("id, email").in("id", actorIds),
          realClient
            .from("member_profiles")
            .select("user_id, full_name")
            .in("user_id", actorIds)
            .is("deleted_at", null),
          realClient
            .from("company_profiles")
            .select("user_id, name")
            .in("user_id", actorIds)
            .is("deleted_at", null),
        ])
      for (const u of (users ?? []) as Array<{ id: number; email: string }>) {
        actorMap[u.id] = { id: u.id, email: u.email, displayName: u.email }
      }
      for (const m of (members ?? []) as Array<{
        user_id: number
        full_name: string
      }>) {
        if (actorMap[m.user_id]) actorMap[m.user_id].displayName = m.full_name
      }
      for (const c of (companies ?? []) as Array<{
        user_id: number
        name: string
      }>) {
        if (actorMap[c.user_id]) actorMap[c.user_id].displayName = c.name
      }
    }

    const recentActions: AdminRecentAction[] = auditList.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      reason: a.reason,
      createdAt: a.created_at,
      actor: a.actor_id != null ? (actorMap[a.actor_id] ?? null) : null,
    }))

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
      recentActions,
    }
  } catch (err) {
    console.error("[admin-dashboard]", err)
    return EMPTY
  }
}
