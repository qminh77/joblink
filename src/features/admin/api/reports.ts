"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type {
  ModerationActionType,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import {
  moderationActionSchema,
  reportStatusSchema,
  type ModerationActionInput,
} from "../schemas"
import type { AdminReportRow } from "../types"

export type ListReportsParams = {
  targetType?: ReportTargetType | "all"
  status?: ReportStatus | "all"
  limit?: number
}

export async function listAdminReports(
  params: ListReportsParams = {},
): Promise<AdminReportRow[]> {
  await requireAdmin()
  const supabase = createAdminClient()
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

  const { data } = await query
  const rows = (data ?? []) as Array<{
    id: number
    reporter_id: number
    target_type: ReportTargetType
    target_id: number
    reason: string
    description: string | null
    status: ReportStatus
    created_at: string
  }>

  const reporterIds = [...new Set(rows.map((r) => r.reporter_id))]
  const reporterData: Record<number, { name: string; avatar: string | null }> = {}
  if (reporterIds.length > 0) {
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
    for (const m of members ?? []) {
      reporterData[m.user_id] = { name: m.full_name, avatar: m.avatar_url }
    }
    for (const c of companies ?? []) {
      if (!reporterData[c.user_id]) {
        reporterData[c.user_id] = { name: c.name, avatar: c.logo_url }
      }
    }
    for (const u of users ?? []) {
      if (!reporterData[u.id]) {
        reporterData[u.id] = { name: u.email, avatar: null }
      }
    }
  }

  const reasonCodes = [...new Set(rows.map((r) => r.reason))]
  const reasonNameMap: Record<string, string> = {}
  if (reasonCodes.length > 0) {
    const { data: reportTypes } = await supabase
      .from("report_types")
      .select("code, name")
      .in("code", reasonCodes)
    for (const rt of (reportTypes ?? []) as Array<{ code: string; name: string }>) {
      reasonNameMap[rt.code] = rt.name
    }
  }

  const targetIdsByType = new Map<ReportTargetType, number[]>()
  for (const r of rows) {
    const arr = targetIdsByType.get(r.target_type) ?? []
    arr.push(r.target_id)
    targetIdsByType.set(r.target_type, arr)
  }

  const previewMap = new Map<string, { label: string; snippet: string | null; url: string | null }>()

  const fetchTasks: PromiseLike<void>[] = []

  if (targetIdsByType.has("post")) {
    const ids = targetIdsByType.get("post")!
    fetchTasks.push(
      supabase
        .from("posts")
        .select("id, content, author_id")
        .in("id", ids)
        .then(({ data: posts }) => {
          for (const p of posts ?? []) {
            const snippet = (p.content ?? "").slice(0, 200)
            previewMap.set(`post-${p.id}`, {
              label: "Bài viết",
              snippet: snippet || "(nội dung trống)",
              url: null,
            })
          }
        }),
    )
  }

  if (targetIdsByType.has("comment")) {
    const ids = targetIdsByType.get("comment")!
    fetchTasks.push(
      supabase
        .from("post_comments")
        .select("id, content")
        .in("id", ids)
        .then(({ data: comments }) => {
          for (const c of comments ?? []) {
            const snippet = (c.content ?? "").slice(0, 150)
            previewMap.set(`comment-${c.id}`, {
              label: "Bình luận",
              snippet: snippet || "(nội dung trống)",
              url: null,
            })
          }
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
        .then(({ data: jobs }) => {
          for (const j of jobs ?? []) {
            previewMap.set(`job-${j.id}`, {
              label: j.title,
              snippet: null,
              url: `/jobs/${j.id}`,
            })
          }
        }),
    )
  }

  if (targetIdsByType.has("user")) {
    const ids = targetIdsByType.get("user")!
    fetchTasks.push(
      supabase
        .from("member_profiles")
        .select("user_id, full_name, headline")
        .in("user_id", ids)
        .is("deleted_at", null)
        .then(({ data: profiles }) => {
          for (const p of profiles ?? []) {
            previewMap.set(`user-${p.user_id}`, {
              label: p.full_name,
              snippet: p.headline,
              url: `/profile/${p.user_id}`,
            })
          }
        }),
    )
  }

  if (targetIdsByType.has("company")) {
    const ids = targetIdsByType.get("company")!
    fetchTasks.push(
      supabase
        .from("company_profiles")
        .select("user_id, name")
        .in("user_id", ids)
        .is("deleted_at", null)
        .then(({ data: companies }) => {
          for (const c of companies ?? []) {
            previewMap.set(`company-${c.user_id}`, {
              label: c.name,
              snippet: null,
              url: `/company/${c.user_id}`,
            })
          }
        }),
    )
  }

  await Promise.all(fetchTasks)

  return rows.map((r) => {
    const rd = reporterData[r.reporter_id] ?? { name: `user#${r.reporter_id}`, avatar: null }
    const key = `${r.target_type}-${r.target_id}`
    const preview = previewMap.get(key) ?? { label: `#${r.target_id}`, snippet: null, url: null }
    return {
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: rd.name,
      reporterAvatar: rd.avatar,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      reasonName: reasonNameMap[r.reason] ?? r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.created_at,
      targetPreview: preview,
    }
  })
}

export async function setReportStatus(
  reportId: number,
  status: ReportStatus,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = reportStatusSchema.safeParse({ reportId, status })
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: prev } = await supabase
    .from("reports")
    .select("status")
    .eq("id", reportId)
    .maybeSingle<{ status: ReportStatus }>()
  if (!prev) return { ok: false, error: "not_found" }

  const payload = {
    status,
    resolved_by:
      status === "resolved" || status === "dismissed"
        ? current.appUser.id
        : null,
    resolved_at:
      status === "resolved" || status === "dismissed"
        ? new Date().toISOString()
        : null,
  }

  const { error } = await supabase
    .from("reports")
    .update(payload as never)
    .eq("id", reportId)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `report.${status}`,
    entityType: "reports",
    entityId: reportId,
    oldData: { status: prev.status },
    newData: { status },
  })

  revalidatePath("/admin/reports")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}

const TARGET_TABLE: Record<ReportTargetType, string | null> = {
  user: "users",
  post: "posts",
  comment: "post_comments",
  job: "jobs",
  company: "company_profiles",
}

export async function applyModerationAction(
  input: ModerationActionInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = moderationActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: report } = await supabase
    .from("reports")
    .select("id, target_type, target_id, status")
    .eq("id", parsed.data.reportId)
    .maybeSingle<{
      id: number
      target_type: ReportTargetType
      target_id: number
      status: ReportStatus
    }>()
  if (!report) return { ok: false, error: "not_found" }

  const actionType = parsed.data.actionType as ModerationActionType

  if (actionType !== "dismiss" && actionType !== "warn") {
    const tbl = TARGET_TABLE[report.target_type]
    if (!tbl) return { ok: false, error: "invalid_target" }

    const supabaseAny = supabase as unknown as {
      from: (t: string) => {
        update: (p: Record<string, unknown>) => {
          eq: (
            col: string,
            v: number,
          ) => Promise<{ error: { message: string } | null }>
        }
      }
    }

    if (report.target_type === "user") {
      if (actionType === "suspend") {
        await supabaseAny
          .from("users")
          .update({ status: "suspended" })
          .eq("id", report.target_id)
      } else if (actionType === "ban") {
        await supabaseAny
          .from("users")
          .update({ status: "banned" })
          .eq("id", report.target_id)
      } else if (actionType === "restore") {
        await supabaseAny
          .from("users")
          .update({ status: "active" })
          .eq("id", report.target_id)
      }
    } else if (
      actionType === "hide" ||
      actionType === "delete" ||
      actionType === "restore"
    ) {
      if (report.target_type === "post" || report.target_type === "comment") {
        const newStatus =
          actionType === "restore"
            ? "active"
            : actionType === "hide"
              ? "hidden"
              : "deleted"
        await supabaseAny
          .from(tbl)
          .update({
            status: newStatus,
            ...(actionType === "delete"
              ? { deleted_at: new Date().toISOString() }
              : { deleted_at: null }),
          })
          .eq("id", report.target_id)
      } else if (report.target_type === "job") {
        const newStatus = actionType === "restore" ? "active" : "removed"
        await supabaseAny
          .from(tbl)
          .update({
            status: newStatus,
            ...(actionType === "delete"
              ? { deleted_at: new Date().toISOString() }
              : { deleted_at: null }),
          })
          .eq("id", report.target_id)
      } else if (report.target_type === "company") {
        if (actionType === "delete" || actionType === "hide") {
          await supabaseAny
            .from("company_profiles")
            .update({ verification_status: "suspended" })
            .eq("user_id", report.target_id)
        } else if (actionType === "restore") {
          await supabaseAny
            .from("company_profiles")
            .update({ verification_status: "verified" })
            .eq("user_id", report.target_id)
        }
      }
    }
  }

  await supabase.from("moderation_actions").insert({
    report_id: parsed.data.reportId,
    moderator_id: current.appUser.id,
    target_type: report.target_type,
    target_id: report.target_id,
    action_type: actionType,
    reason: parsed.data.reason,
  })

  const newReportStatus: ReportStatus =
    actionType === "dismiss" ? "dismissed" : "resolved"

  await supabase
    .from("reports")
    .update({
      status: newReportStatus,
      resolved_by: current.appUser.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId)

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `moderation.${actionType}`,
    entityType: report.target_type,
    entityId: report.target_id,
    oldData: { reportStatus: report.status },
    newData: { reportStatus: newReportStatus, actionType },
    reason: parsed.data.reason,
  })

  revalidatePath("/admin/reports")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true }
}
