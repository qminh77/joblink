import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"

import { writeAuditLog } from "./audit-log.service"
import type { ModerationActionInput } from "../schemas"
import type { AdminActionResult } from "../types"
import {
  getModerationReport,
  getReportStatus,
  insertModerationAction,
  resolveReportAfterModeration,
  updateCompanyVerificationForModeration,
  updateContentStatusForModeration,
  updateReportStatus,
  updateUserStatusForModeration,
} from "../data/reports.repo"

type AdminSupabase = ReturnType<typeof createAdminClient>

type AdminActor = {
  appUser: { id: number }
}

const CONTENT_TARGET_TABLE: Partial<
  Record<ReportTargetType, "posts" | "post_comments" | "jobs">
> = {
  post: "posts",
  comment: "post_comments",
  job: "jobs",
}

const TARGET_TABLE: Record<ReportTargetType, string | null> = {
  user: "users",
  post: "posts",
  comment: "post_comments",
  job: "jobs",
  company: "company_profiles",
}

export async function changeReportStatus(
  supabase: AdminSupabase,
  actor: AdminActor,
  reportId: number,
  status: ReportStatus,
): Promise<AdminActionResult> {
  const { data: prev } = await getReportStatus(supabase, reportId)
  if (!prev) return { ok: false, error: "not_found" }

  const resolved = status === "resolved" || status === "dismissed"
  const { error } = await updateReportStatus(supabase, reportId, {
    status,
    resolved_by: resolved ? actor.appUser.id : null,
    resolved_at: resolved ? new Date().toISOString() : null,
  })
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `report.${status}`,
    entityType: "reports",
    entityId: reportId,
    oldData: { status: prev.status },
    newData: { status },
  })

  return { ok: true }
}

export async function applyReportModeration(
  supabase: AdminSupabase,
  actor: AdminActor,
  input: ModerationActionInput,
): Promise<AdminActionResult> {
  const { data: report } = await getModerationReport(supabase, input.reportId)
  if (!report) return { ok: false, error: "not_found" }

  const actionType = input.actionType as ModerationActionType
  const targetResult = await applyTargetModerationMutation(
    supabase,
    report.target_type,
    report.target_id,
    actionType,
  )
  if (!targetResult.ok) return targetResult

  await insertModerationAction(supabase, {
    reportId: input.reportId,
    moderatorId: actor.appUser.id,
    targetType: report.target_type,
    targetId: report.target_id,
    actionType,
    reason: input.reason,
  })

  const newReportStatus: ReportStatus =
    actionType === "dismiss" ? "dismissed" : "resolved"

  await resolveReportAfterModeration(
    supabase,
    input.reportId,
    actor.appUser.id,
    newReportStatus,
  )

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `moderation.${actionType}`,
    entityType: report.target_type,
    entityId: report.target_id,
    oldData: { reportStatus: report.status },
    newData: { reportStatus: newReportStatus, actionType },
    reason: input.reason,
  })

  return { ok: true }
}

async function applyTargetModerationMutation(
  supabase: AdminSupabase,
  targetType: ReportTargetType,
  targetId: number,
  actionType: ModerationActionType,
): Promise<AdminActionResult> {
  if (actionType === "dismiss" || actionType === "warn") return { ok: true }

  const table = TARGET_TABLE[targetType]
  if (!table) return { ok: false, error: "invalid_target" }

  if (targetType === "user") {
    if (actionType === "suspend") {
      await updateUserStatusForModeration(supabase, targetId, "suspended")
    } else if (actionType === "ban") {
      await updateUserStatusForModeration(supabase, targetId, "banned")
    } else if (actionType === "restore") {
      await updateUserStatusForModeration(supabase, targetId, "active")
    }
    return { ok: true }
  }

  if (
    actionType !== "hide" &&
    actionType !== "delete" &&
    actionType !== "restore"
  ) {
    return { ok: true }
  }

  if (targetType === "post" || targetType === "comment") {
    const newStatus =
      actionType === "restore"
        ? "active"
        : actionType === "hide"
          ? "hidden"
          : "deleted"

    await updateContentStatusForModeration(
      supabase,
      CONTENT_TARGET_TABLE[targetType]!,
      targetId,
      {
        status: newStatus,
        ...(actionType === "delete"
          ? { deleted_at: new Date().toISOString() }
          : { deleted_at: null }),
      },
    )
  } else if (targetType === "job") {
    const newStatus = actionType === "restore" ? "active" : "removed"

    await updateContentStatusForModeration(
      supabase,
      CONTENT_TARGET_TABLE[targetType]!,
      targetId,
      {
        status: newStatus,
        ...(actionType === "delete"
          ? { deleted_at: new Date().toISOString() }
          : { deleted_at: null }),
      },
    )
  } else if (targetType === "company") {
    if (actionType === "delete" || actionType === "hide") {
      await updateCompanyVerificationForModeration(
        supabase,
        targetId,
        "suspended",
      )
    } else if (actionType === "restore") {
      await updateCompanyVerificationForModeration(
        supabase,
        targetId,
        "verified",
      )
    }
  }

  return { ok: true }
}
