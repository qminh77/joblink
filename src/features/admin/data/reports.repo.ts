import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"

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

export type ModerationReportRecord = {
  id: number
  target_type: ReportTargetType
  target_id: number
  status: ReportStatus
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

export function getReportStatus(supabase: AdminSupabase, reportId: number) {
  return supabase
    .from("reports")
    .select("status")
    .eq("id", reportId)
    .maybeSingle<{ status: ReportStatus }>()
}

export function updateReportStatus(
  supabase: AdminSupabase,
  reportId: number,
  payload: {
    status: ReportStatus
    resolved_by: number | null
    resolved_at: string | null
  },
) {
  return supabase.from("reports").update(payload as never).eq("id", reportId)
}

export function getModerationReport(
  supabase: AdminSupabase,
  reportId: number,
) {
  return supabase
    .from("reports")
    .select("id, target_type, target_id, status")
    .eq("id", reportId)
    .maybeSingle<ModerationReportRecord>()
}

type DynamicUpdateClient = {
  from: (table: string) => {
    update: (payload: Record<string, unknown>) => {
      eq: (
        column: string,
        value: number,
      ) => Promise<{ error: { message: string } | null }>
    }
  }
}

function updateDynamicRecord(
  supabase: AdminSupabase,
  table: string,
  column: string,
  id: number,
  payload: Record<string, unknown>,
) {
  const dynamicClient = supabase as unknown as DynamicUpdateClient
  return dynamicClient.from(table).update(payload).eq(column, id)
}

export function updateUserStatusForModeration(
  supabase: AdminSupabase,
  userId: number,
  status: "active" | "suspended" | "banned",
) {
  return updateDynamicRecord(supabase, "users", "id", userId, { status })
}

export function updateContentStatusForModeration(
  supabase: AdminSupabase,
  table: "posts" | "post_comments" | "jobs",
  targetId: number,
  payload: Record<string, unknown>,
) {
  return updateDynamicRecord(supabase, table, "id", targetId, payload)
}

export function updateCompanyVerificationForModeration(
  supabase: AdminSupabase,
  companyUserId: number,
  verificationStatus: "verified" | "suspended",
) {
  return updateDynamicRecord(
    supabase,
    "company_profiles",
    "user_id",
    companyUserId,
    { verification_status: verificationStatus },
  )
}

export function insertModerationAction(
  supabase: AdminSupabase,
  values: {
    reportId: number
    moderatorId: number
    targetType: ReportTargetType
    targetId: number
    actionType: ModerationActionType
    reason: string
  },
) {
  return supabase.from("moderation_actions").insert({
    report_id: values.reportId,
    moderator_id: values.moderatorId,
    target_type: values.targetType,
    target_id: values.targetId,
    action_type: values.actionType,
    reason: values.reason,
  })
}

export function resolveReportAfterModeration(
  supabase: AdminSupabase,
  reportId: number,
  moderatorId: number,
  status: ReportStatus,
) {
  return supabase
    .from("reports")
    .update({
      status,
      resolved_by: moderatorId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId)
}
