import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"

import { writeAuditLog } from "../api/audit-log"
import type { ModerationActionInput } from "../schemas"
import type {
  AdminActionResult,
  AdminReportRow,
  ListReportsParams,
} from "../types"
import {
  getModerationReport,
  getReportStatus,
  insertModerationAction,
  listProfileIdentityRows,
  listReporterIdentityRows,
  listReportRows,
  listReportTargetRows,
  listReportTypeNameRows,
  resolveReportAfterModeration,
  updateCompanyVerificationForModeration,
  updateContentStatusForModeration,
  updateReportStatus,
  updateUserStatusForModeration,
  type AdminReportRecord,
  type CommentTargetRow,
  type JobTargetRow,
  type PostTargetRow,
  type ReportTargetRows,
} from "../data/reports.repo"

type AdminSupabase = ReturnType<typeof createAdminClient>

type Identity = { name: string; avatar: string | null }

type TargetPreview = {
  label: string
  snippet: string | null
  url: string | null
}

type AuthorLookup = {
  postAuthorMap: Map<number, number>
  commentAuthorMap: Map<number, number>
  jobAuthorMap: Map<number, number>
}

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

export async function loadAdminReports(
  supabase: AdminSupabase,
  params: ListReportsParams = {},
): Promise<AdminReportRow[]> {
  const { data } = await listReportRows(supabase, params)
  const rows = (data ?? []) as AdminReportRecord[]

  const reporterData = await buildReporterData(supabase, rows)
  const reasonNameMap = await buildReasonNameMap(supabase, rows)
  const targetIdsByType = groupTargetIdsByType(rows)
  const targetRows = await listReportTargetRows(supabase, targetIdsByType)
  const previewMap = buildPreviewMap(targetRows)
  const authorData = await buildAuthorData(supabase, rows, targetRows)
  const authorLookup = buildAuthorLookup(targetRows)

  return rows.map((row) => {
    const reporter = reporterData[row.reporter_id] ?? {
      name: `user#${row.reporter_id}`,
      avatar: null,
    }
    const key = targetKey(row.target_type, row.target_id)
    const preview = previewMap.get(key) ?? {
      label: `#${row.target_id}`,
      snippet: null,
      url: null,
    }
    const author = getAuthorInfo(
      authorData,
      authorLookup,
      row.target_type,
      row.target_id,
    )

    return {
      id: row.id,
      reporterId: row.reporter_id,
      reporterName: reporter.name,
      reporterAvatar: reporter.avatar,
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.reason,
      reasonName: reasonNameMap[row.reason] ?? row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      targetAuthorName: author?.name ?? null,
      targetAuthorAvatar: author?.avatar ?? null,
      targetPreview: preview,
    }
  })
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

async function buildReporterData(
  supabase: AdminSupabase,
  rows: AdminReportRecord[],
) {
  const reporterIds = [...new Set(rows.map((row) => row.reporter_id))]
  const reporterData: Record<number, Identity> = {}
  const { members, companies, users } = await listReporterIdentityRows(
    supabase,
    reporterIds,
  )

  for (const member of members) {
    reporterData[member.user_id] = {
      name: member.full_name,
      avatar: member.avatar_url,
    }
  }
  for (const company of companies) {
    if (!reporterData[company.user_id]) {
      reporterData[company.user_id] = {
        name: company.name,
        avatar: company.logo_url,
      }
    }
  }
  for (const user of users) {
    if (!reporterData[user.id]) {
      reporterData[user.id] = { name: user.email, avatar: null }
    }
  }

  return reporterData
}

async function buildReasonNameMap(
  supabase: AdminSupabase,
  rows: AdminReportRecord[],
) {
  const reasonCodes = [...new Set(rows.map((row) => row.reason))]
  const reportTypes = await listReportTypeNameRows(supabase, reasonCodes)
  const reasonNameMap: Record<string, string> = {}

  for (const reportType of reportTypes) {
    reasonNameMap[reportType.code] = reportType.name
  }

  return reasonNameMap
}

function groupTargetIdsByType(rows: AdminReportRecord[]) {
  const targetIdsByType = new Map<ReportTargetType, number[]>()

  for (const row of rows) {
    const targetIds = targetIdsByType.get(row.target_type) ?? []
    targetIds.push(row.target_id)
    targetIdsByType.set(row.target_type, targetIds)
  }

  return targetIdsByType
}

function buildPreviewMap(targetRows: ReportTargetRows) {
  const previewMap = new Map<string, TargetPreview>()

  for (const user of targetRows.userRows) {
    previewMap.set(targetKey("user", user.user_id), {
      label: user.full_name,
      snippet: user.headline,
      url: `/profile/${user.user_id}`,
    })
  }

  for (const company of targetRows.companyRows) {
    previewMap.set(targetKey("company", company.user_id), {
      label: company.name,
      snippet: null,
      url: `/company/${company.user_id}`,
    })
  }

  for (const post of targetRows.postRows) {
    const snippet = (post.content ?? "").slice(0, 200)
    previewMap.set(targetKey("post", post.id), {
      label: "Bài viết",
      snippet: snippet || "(nội dung trống)",
      url: null,
    })
  }

  for (const comment of targetRows.commentRows) {
    const snippet = (comment.content ?? "").slice(0, 150)
    previewMap.set(targetKey("comment", comment.id), {
      label: "Bình luận",
      snippet: snippet || "(nội dung trống)",
      url: null,
    })
  }

  for (const job of targetRows.jobRows) {
    previewMap.set(targetKey("job", job.id), {
      label: job.title ?? "(không có tiêu đề)",
      snippet: null,
      url: `/jobs/${job.id}`,
    })
  }

  return previewMap
}

async function buildAuthorData(
  supabase: AdminSupabase,
  rows: AdminReportRecord[],
  targetRows: ReportTargetRows,
) {
  const authorUserIds = new Set<number>()

  for (const post of targetRows.postRows) authorUserIds.add(post.author_id)
  for (const comment of targetRows.commentRows) authorUserIds.add(comment.user_id)
  for (const job of targetRows.jobRows) authorUserIds.add(job.company_user_id)
  for (const row of rows) {
    if (row.target_type === "user" || row.target_type === "company") {
      authorUserIds.add(row.target_id)
    }
  }

  const { members, companies } = await listProfileIdentityRows(
    supabase,
    [...authorUserIds],
  )
  const authorData = new Map<number, Identity>()

  for (const member of members) {
    authorData.set(member.user_id, {
      name: member.full_name,
      avatar: member.avatar_url,
    })
  }
  for (const company of companies) {
    if (!authorData.has(company.user_id)) {
      authorData.set(company.user_id, {
        name: company.name,
        avatar: company.logo_url,
      })
    }
  }

  return authorData
}

function getAuthorInfo(
  authorData: Map<number, Identity>,
  authorLookup: AuthorLookup,
  targetType: ReportTargetType,
  targetId: number,
) {
  const authorId = getAuthorId(authorLookup, targetType, targetId)
  if (authorId == null) return null
  return authorData.get(authorId) ?? null
}

function getAuthorId(
  authorLookup: AuthorLookup,
  targetType: ReportTargetType,
  targetId: number,
) {
  if (targetType === "post") {
    return authorLookup.postAuthorMap.get(targetId) ?? null
  }
  if (targetType === "comment") {
    return authorLookup.commentAuthorMap.get(targetId) ?? null
  }
  if (targetType === "job") {
    return authorLookup.jobAuthorMap.get(targetId) ?? null
  }
  return targetId
}

function buildAuthorLookup(targetRows: ReportTargetRows): AuthorLookup {
  return {
    postAuthorMap: new Map(
      targetRows.postRows.map((row: PostTargetRow) => [row.id, row.author_id]),
    ),
    commentAuthorMap: new Map(
      targetRows.commentRows.map((row: CommentTargetRow) => [
        row.id,
        row.user_id,
      ]),
    ),
    jobAuthorMap: new Map(
      targetRows.jobRows.map((row: JobTargetRow) => [
        row.id,
        row.company_user_id,
      ]),
    ),
  }
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

function targetKey(targetType: ReportTargetType, targetId: number) {
  return `${targetType}-${targetId}`
}
