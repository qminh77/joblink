import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { ReportStatus, ReportTargetType } from "@/types/database"

import type { ListReportsParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AdminReportRecord = {
  id: number
  reporter_id: number
  target_type: ReportTargetType
  target_id: number
  reason: string
  description: string | null
  status: ReportStatus
  created_at: string
}

export type ReporterMemberRow = {
  user_id: number
  full_name: string
  avatar_url: string | null
}

export type ReporterCompanyRow = {
  user_id: number
  name: string
  logo_url: string | null
}

export type ReporterUserRow = {
  id: number
  email: string
}

export type PostTargetRow = {
  id: number
  content: string | null
  author_id: number
}

export type CommentTargetRow = {
  id: number
  content: string | null
  user_id: number
}

export type JobTargetRow = {
  id: number
  title: string | null
  company_user_id: number
}

export type UserTargetProfileRow = {
  user_id: number
  full_name: string
  headline: string | null
  avatar_url: string | null
}

export type CompanyTargetProfileRow = {
  user_id: number
  name: string
  logo_url: string | null
}

export type ReportTargetRows = {
  postRows: PostTargetRow[]
  commentRows: CommentTargetRow[]
  jobRows: JobTargetRow[]
  userRows: UserTargetProfileRow[]
  companyRows: CompanyTargetProfileRow[]
}

export function listReportRows(
  supabase: AdminSupabase,
  params: ListReportsParams,
) {
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, description, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.targetType && params.targetType !== "all") {
    query = query.eq("target_type", params.targetType)
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  return query
}

export async function listReporterIdentityRows(
  supabase: AdminSupabase,
  reporterIds: number[],
) {
  if (reporterIds.length === 0) {
    return { members: [], companies: [], users: [] }
  }

  const [{ data: members }, { data: companies }, { data: users }] =
    await Promise.all([
      supabase
        .from("member_profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", reporterIds)
        .is("deleted_at", null),
      supabase
        .from("company_profiles")
        .select("user_id, name, logo_url")
        .in("user_id", reporterIds)
        .is("deleted_at", null),
      supabase.from("users").select("id, email").in("id", reporterIds),
    ])

  return {
    members: (members ?? []) as ReporterMemberRow[],
    companies: (companies ?? []) as ReporterCompanyRow[],
    users: (users ?? []) as ReporterUserRow[],
  }
}

export async function listReportTargetRows(
  supabase: AdminSupabase,
  targetIdsByType: Map<ReportTargetType, number[]>,
): Promise<ReportTargetRows> {
  let postRows: PostTargetRow[] = []
  let commentRows: CommentTargetRow[] = []
  let jobRows: JobTargetRow[] = []
  let userRows: UserTargetProfileRow[] = []
  let companyRows: CompanyTargetProfileRow[] = []

  const fetchTasks: PromiseLike<void>[] = []

  if (targetIdsByType.has("post")) {
    const ids = targetIdsByType.get("post")!
    fetchTasks.push(
      supabase
        .from("posts")
        .select("id, content, author_id")
        .in("id", ids)
        .then(({ data }) => {
          postRows = (data ?? []) as PostTargetRow[]
        }),
    )
  }

  if (targetIdsByType.has("comment")) {
    const ids = targetIdsByType.get("comment")!
    fetchTasks.push(
      supabase
        .from("post_comments")
        .select("id, content, user_id")
        .in("id", ids)
        .then(({ data }) => {
          commentRows = (data ?? []) as CommentTargetRow[]
        }),
    )
  }

  if (targetIdsByType.has("job")) {
    const ids = targetIdsByType.get("job")!
    fetchTasks.push(
      supabase
        .from("jobs")
        .select("id, title, company_user_id")
        .in("id", ids)
        .then(({ data }) => {
          jobRows = (data ?? []) as JobTargetRow[]
        }),
    )
  }

  if (targetIdsByType.has("user")) {
    const ids = targetIdsByType.get("user")!
    fetchTasks.push(
      supabase
        .from("member_profiles")
        .select("user_id, full_name, headline, avatar_url")
        .in("user_id", ids)
        .is("deleted_at", null)
        .then(({ data }) => {
          userRows = (data ?? []) as UserTargetProfileRow[]
        }),
    )
  }

  if (targetIdsByType.has("company")) {
    const ids = targetIdsByType.get("company")!
    fetchTasks.push(
      supabase
        .from("company_profiles")
        .select("user_id, name, logo_url")
        .in("user_id", ids)
        .is("deleted_at", null)
        .then(({ data }) => {
          companyRows = (data ?? []) as CompanyTargetProfileRow[]
        }),
    )
  }

  await Promise.all(fetchTasks)

  return { postRows, commentRows, jobRows, userRows, companyRows }
}

export async function listProfileIdentityRows(
  supabase: AdminSupabase,
  userIds: number[],
) {
  if (userIds.length === 0) {
    return { members: [], companies: [] }
  }

  const [{ data: members }, { data: companies }] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds)
      .is("deleted_at", null),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url")
      .in("user_id", userIds)
      .is("deleted_at", null),
  ])

  return {
    members: (members ?? []) as ReporterMemberRow[],
    companies: (companies ?? []) as ReporterCompanyRow[],
  }
}
