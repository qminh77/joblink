"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import type { AppealStatus } from "@/types/database"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { appealActionSchema, type AppealActionInput } from "../schemas"

export type AdminAppealRow = {
  id: number
  appellantId: number
  appellantName: string
  reportId: number | null
  moderationActionId: number | null
  reason: string
  status: AppealStatus
  reviewedAt: string | null
  createdAt: string
}

export type ListAppealsParams = {
  status?: AppealStatus | "all"
  limit?: number
}

export async function listAdminAppeals(
  params: ListAppealsParams = {},
): Promise<AdminAppealRow[]> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("appeals")
    .select(
      "id, appellant_id, report_id, moderation_action_id, reason, status, reviewed_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const { data, error } = await query
  if (error) return []
  const rows = (data ?? []) as Array<{
    id: number
    appellant_id: number
    report_id: number | null
    moderation_action_id: number | null
    reason: string
    status: AppealStatus
    reviewed_at: string | null
    created_at: string
  }>

  const ids = [...new Set(rows.map((r) => r.appellant_id))]
  const names: Record<number, string> = {}
  if (ids.length > 0) {
    const [{ data: members }, { data: companies }, { data: users }] =
      await Promise.all([
        supabase
          .from("member_profiles")
          .select("user_id, full_name")
          .in("user_id", ids)
          .is("deleted_at", null),
        supabase
          .from("company_profiles")
          .select("user_id, name")
          .in("user_id", ids)
          .is("deleted_at", null),
        supabase.from("users").select("id, email").in("id", ids),
      ])
    for (const m of (members ?? []) as Array<{
      user_id: number
      full_name: string
    }>) {
      names[m.user_id] = m.full_name
    }
    for (const c of (companies ?? []) as Array<{
      user_id: number
      name: string
    }>) {
      names[c.user_id] = c.name
    }
    for (const u of (users ?? []) as Array<{ id: number; email: string }>) {
      if (!names[u.id]) names[u.id] = u.email
    }
  }

  return rows.map((r) => ({
    id: r.id,
    appellantId: r.appellant_id,
    appellantName: names[r.appellant_id] ?? `user#${r.appellant_id}`,
    reportId: r.report_id,
    moderationActionId: r.moderation_action_id,
    reason: r.reason,
    status: r.status,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }))
}

export async function applyAppealAction(
  input: AppealActionInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = appealActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("appeals")
    .select("id, status, appellant_id")
    .eq("id", parsed.data.appealId)
    .maybeSingle<{ id: number; status: AppealStatus; appellant_id: number }>()
  if (!target) return { ok: false, error: "not_found" }

  const newStatus: AppealStatus =
    parsed.data.action === "accept" ? "accepted" : "rejected"

  const { error } = await supabase
    .from("appeals")
    .update({
      status: newStatus,
      reviewed_by: current.appUser.id,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", parsed.data.appealId)
  if (error) return { ok: false, error: "update_failed" }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `appeal.${parsed.data.action}`,
    entityType: "appeals",
    entityId: parsed.data.appealId,
    oldData: { status: target.status },
    newData: { status: newStatus },
    reason: parsed.data.note ?? null,
  })

  revalidatePath("/admin/appeals")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}
