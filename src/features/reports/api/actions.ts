"use server"

import { createClient } from "@/lib/supabase/server"
import { action, parse, unwrap } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"

import { createReportSchema } from "../schemas"
import {
  insertReport,
  type ReportTypeOption,
} from "../data/reports.repo"

export type { ReportTypeOption } from "../data/reports.repo"

export async function createReportAction(input: {
  targetType: string
  targetId: number
  reason: string
  description?: string | null
}): Promise<ActionResult<{ reportId: number }>> {
  return action("reports.errors", async (t) => {
    const data = parse(createReportSchema(t), input)
    const current = await requirePermission("reports.create")
    const supabase = await createClient()

    const row = unwrap(
      await insertReport(supabase, {
        reporterId: current.appUser.id,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description ?? null,
      }),
      "createFailed",
    )
    return { reportId: row.id }
  })
}
