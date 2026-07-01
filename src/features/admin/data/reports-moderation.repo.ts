import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type ModerationReportRecord = {
  id: number
  target_type: ReportTargetType
  target_id: number
  status: ReportStatus
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
