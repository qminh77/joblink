"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"

const reportTypeSchema = z.object({
  code: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().max(160).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(99999).optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
})

const reportTypeUpdateSchema = reportTypeSchema.extend({
  id: z.coerce.number().int().positive(),
})

export type ReportTypeRow = {
  id: number
  code: string
  name: string
  nameEn: string | null
  sortOrder: number
  isActive: boolean
  isSystem: boolean
}

type ActionResult = { ok: true } | { ok: false; error: string }

export async function listReportTypes(): Promise<ReportTypeRow[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await (supabase
    .from("report_types")
    .select("id, code, name, name_en, sort_order, is_active")
    .order("sort_order", { ascending: true }) as unknown as Promise<{
    data: Record<string, unknown>[] | null
    error: Error | null
  }>)
  
  if (error) {
    console.error("SUPABASE REPORT TYPES ERROR:", error)
  }
  
  const rawRows = data ?? []

  return rawRows.map((r) => ({
    id: r.id as number,
    code: r.code as string,
    name: r.name as string,
    nameEn: (r.name_en as string | null) ?? null,
    sortOrder: (r.sort_order as number) ?? 0,
    isActive: (r.is_active as boolean) ?? true,
    isSystem: (r.is_system as boolean) ?? false,
  }))
}

export async function createReportType(
  input: unknown,
): Promise<ActionResult> {
  const parsed = reportTypeSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? "invalid_input" }
  }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const payload: Record<string, unknown> = {
    code: parsed.data.code,
    name: parsed.data.name.trim(),
    name_en: parsed.data.nameEn?.trim() || null,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  }

  const { error } = await (supabase
    .from("report_types")
    .insert(payload as never) as never) as {
    error: { message: string } | null
  }

  if (error) {
    console.error("[admin:report-types.create]", error)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "report_types.create",
    entityType: "report_types",
    newData: payload,
  })

  revalidatePath("/admin/report-types")
  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

export async function updateReportType(
  input: unknown,
): Promise<ActionResult> {
  const parsed = reportTypeUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? "invalid_input" }
  }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const prev = await (supabase
    .from("report_types")
    .select("id, code, name")
    .eq("id", parsed.data.id)
    .maybeSingle() as never) as {
    data: { id: number; code: string; name: string } | null
  }

  if (!prev.data) return { ok: false, error: "not_found" }

  const payload: Record<string, unknown> = {
    code: parsed.data.code,
    name: parsed.data.name.trim(),
    name_en: parsed.data.nameEn?.trim() || null,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  }

  const { error } = await (supabase
    .from("report_types")
    .update(payload as never)
    .eq("id", parsed.data.id) as never) as {
    error: { message: string } | null
  }

  if (error) {
    console.error("[admin:report-types.update]", error)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "report_types.update",
    entityType: "report_types",
    entityId: parsed.data.id,
    oldData: prev.data,
    newData: payload,
  })

  revalidatePath("/admin/report-types")
  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

export async function deleteReportType(
  id: number,
): Promise<ActionResult> {
  const parsed = z.coerce.number().int().positive().safeParse(id)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const target = await (supabase
    .from("report_types")
    .select("id")
    .eq("id", parsed.data)
    .maybeSingle() as never) as {
    data: { id: number } | null
  }

  if (!target.data) return { ok: false, error: "not_found" }

  const { error } = await (supabase
    .from("report_types")
    .delete()
    .eq("id", parsed.data) as never) as {
    error: { message: string } | null
  }

  if (error) {
    console.error("[admin:report-types.delete]", error)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "report_types.delete",
    entityType: "report_types",
    entityId: parsed.data,
  })

  revalidatePath("/admin/report-types")
  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}
