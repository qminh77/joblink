import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { ReportTargetType } from "@/types/database"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type ReportTypeOption = {
  id: number
  code: string
  name: string
  nameEn: string | null
}

export async function loadActiveReportTypes(
  supabase: Supabase,
): Promise<ReportTypeOption[]> {
  const { data, error } = await supabase
    .from("report_types")
    .select("id, code, name, name_en")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[loadActiveReportTypes]", error)
    return []
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as number,
    code: r.code as string,
    name: r.name as string,
    nameEn: (r.name_en as string | null) ?? null,
  }))
}

export function insertReport(
  supabase: Supabase,
  values: {
    reporterId: number
    targetType: ReportTargetType
    targetId: number
    reason: string
    description: string | null
  },
) {
  return supabase
    .from("reports")
    .insert({
      reporter_id: values.reporterId,
      target_type: values.targetType,
      target_id: values.targetId,
      reason: values.reason,
      description: values.description,
    })
    .select("id")
    .single<{ id: number }>()
}
