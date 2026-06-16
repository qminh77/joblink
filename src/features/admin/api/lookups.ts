"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import {
  lookupCreateSchema,
  lookupDeleteSchema,
  lookupUpdateSchema,
} from "../schemas"
import type { AdminLookupKind, AdminLookupRow } from "../types"

const KIND_TABLE: Record<AdminLookupKind, string> = {
  provinces: "provinces",
  wards: "wards",
  job_types: "job_types",
  work_modes: "work_modes",
  job_positions: "job_positions",
  report_types: "report_types",
  skills: "skills",
}

const SOFT_DELETE_KINDS = new Set<AdminLookupKind>([
  "provinces",
  "wards",
  "job_types",
  "work_modes",
  "job_positions",
])

type LookupActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string }

type RawLookupRow = {
  id: number
  code?: string | null
  name: string
  name_en?: string | null
  sort_order?: number | null
  is_active?: boolean | null
  is_system?: boolean
  province_id?: number | null
  parent_id?: number | null
}

type LooseClient = {
  from: (t: string) => {
    select: (col: string) => LooseListBuilder
    insert: (p: unknown) => Promise<{ error: { message: string } | null }>
    update: (p: unknown) => {
      eq: (
        col: string,
        v: number,
      ) => Promise<{ error: { message: string } | null }>
    }
    delete: () => {
      eq: (
        col: string,
        v: number,
      ) => Promise<{ error: { message: string } | null }>
    }
  }
}

type LooseListBuilder = Promise<{ data: RawLookupRow[] | null }> & {
  is(col: string, v: null): LooseListBuilder
  order(col: string, opts: { ascending: boolean }): LooseListBuilder
}

export async function listLookups(
  kind: AdminLookupKind,
): Promise<AdminLookupRow[]> {
  await requireAdmin()
  const supabase = createAdminClient() as unknown as LooseClient
  const table = KIND_TABLE[kind]

  let select = "id, name"
  if (kind !== "skills") {
    select += ", code, name_en, sort_order, is_active"
  }
  if (kind === "job_types" || kind === "work_modes" || kind === "report_types") {
    select += ", is_system"
  }
  if (kind === "wards") {
    select += ", province_id"
  }
  if (kind === "job_positions") {
    select += ", parent_id"
  }

  const builder = supabase.from(table).select(select)
  const ordered =
    kind === "skills"
      ? builder.order("name", { ascending: true })
      : SOFT_DELETE_KINDS.has(kind)
        ? builder
            .is("deleted_at", null)
            .order("sort_order", { ascending: true })
        : builder.order("sort_order", { ascending: true })
  const result = await ordered

  return (result.data ?? []).map((r) => ({
    id: r.id,
    code: r.code ?? "",
    name: r.name,
    nameEn: r.name_en ?? null,
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active ?? true,
    isSystem: r.is_system,
    provinceId: r.province_id ?? null,
    parentId: r.parent_id ?? null,
  }))
}

function buildPayload(
  kind: AdminLookupKind,
  input: {
    code?: string | null
    name: string
    nameEn?: string | null
    sortOrder?: number
    isActive?: boolean
    provinceId?: number | null
    parentId?: number | null
  },
): Record<string, unknown> {
  if (kind === "skills") {
    return { name: input.name.trim() }
  }
  const payload: Record<string, unknown> = {
    code: input.code?.trim() ?? "",
    name: input.name.trim(),
    name_en: input.nameEn?.trim() || null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  }
  if (kind === "wards") payload.province_id = input.provinceId ?? null
  if (kind === "job_positions") payload.parent_id = input.parentId ?? null
  return payload
}

function firstZodIssue(parsed: ReturnType<typeof lookupCreateSchema.safeParse>) {
  if (parsed.success) return null
  const issue = parsed.error.issues[0]
  return {
    field: issue.path.join(".") || "form",
    message: issue.message || "invalid",
  }
}

export async function createLookup(
  input: unknown,
): Promise<LookupActionResult> {
  const parsed = lookupCreateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = firstZodIssue(parsed)
    return { ok: false, error: issue?.message ?? "invalid_input", field: issue?.field }
  }
  const current = await requireAdmin()
  const supabase = createAdminClient() as unknown as LooseClient
  const table = KIND_TABLE[parsed.data.kind]
  const payload = buildPayload(parsed.data.kind, parsed.data)

  const { error } = await supabase.from(table).insert(payload)
  if (error) {
    console.error("[admin:lookup.create]", error)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `lookup.${parsed.data.kind}.create`,
    entityType: table,
    newData: payload,
  })

  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

export async function updateLookup(
  input: unknown,
): Promise<LookupActionResult> {
  const parsed = lookupUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const issue = firstZodIssue(parsed)
    return { ok: false, error: issue?.message ?? "invalid_input", field: issue?.field }
  }
  const current = await requireAdmin()
  const supabase = createAdminClient() as unknown as LooseClient
  const table = KIND_TABLE[parsed.data.kind]
  const payload = buildPayload(parsed.data.kind, parsed.data)

  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", parsed.data.id)
  if (error) {
    console.error("[admin:lookup.update]", error)
    return { ok: false, error: "update_failed" }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `lookup.${parsed.data.kind}.update`,
    entityType: table,
    entityId: parsed.data.id,
    newData: payload,
  })

  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

export async function deleteLookup(
  input: unknown,
): Promise<LookupActionResult> {
  const parsed = lookupDeleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const current = await requireAdmin()
  const supabase = createAdminClient() as unknown as LooseClient
  const table = KIND_TABLE[parsed.data.kind]

  if (SOFT_DELETE_KINDS.has(parsed.data.kind)) {
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
    if (error) {
      console.error("[admin:lookup.delete]", error)
      return { ok: false, error: "update_failed" }
    }
  } else {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", parsed.data.id)
    if (error) {
      console.error("[admin:lookup.delete]", error)
      return { ok: false, error: "update_failed" }
    }
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `lookup.${parsed.data.kind}.delete`,
    entityType: table,
    entityId: parsed.data.id,
  })

  revalidatePath("/admin/lookups")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}
