import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import { getReportReasonLabel } from "@/features/reports/lib/report-reasons"
import type { ReportTargetType } from "@/types/database"

import type { AdminReportRow, ListReportsParams } from "../types"
import {
  listProfileIdentityRows,
  listReporterIdentityRows,
  listReportRows,
  listReportTargetRows,
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

export async function loadAdminReports(
  supabase: AdminSupabase,
  params: ListReportsParams = {},
): Promise<AdminReportRow[]> {
  const { data } = await listReportRows(supabase, params)
  const rows = (data ?? []) as AdminReportRecord[]

  const reporterData = await buildReporterData(supabase, rows)
  const reasonNameMap = buildReasonNameMap(rows)
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

function buildReasonNameMap(rows: AdminReportRecord[]) {
  const reasonCodes = [...new Set(rows.map((row) => row.reason))]
  const reasonNameMap: Record<string, string> = {}

  for (const reasonCode of reasonCodes) {
    reasonNameMap[reasonCode] = getReportReasonLabel(reasonCode)
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

function targetKey(targetType: ReportTargetType, targetId: number) {
  return `${targetType}-${targetId}`
}
