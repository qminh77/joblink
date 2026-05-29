"use server"

import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { createReportSchema } from "../schemas"

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

export type ReportTypeOption = {
  id: number
  code: string
  name: string
  nameEn: string | null
}

export async function getReportTypesAction(): Promise<ReportTypeOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("report_types")
    .select("id, code, name, name_en")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[getReportTypesAction]", error)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    nameEn: r.name_en ?? null,
  }))
}

export async function createReportAction(input: {
  targetType: string
  targetId: number
  reason: string
  description?: string | null
}): Promise<ActionResult<{ reportId: number }>> {
  const te = await getTranslations("reports.errors")
  const parsed = createReportSchema(te).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: current.appUser.id,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
      reason: parsed.data.reason,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single()

  if (error || !data) return fail(error?.message ?? te("createFailed"))
  return ok({ reportId: data.id })
}
