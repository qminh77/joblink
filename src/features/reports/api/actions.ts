"use server"

// SRS UC Trace - M08 UC-60 Gui bao cao vi pham.
// Flow: report dialog -> createReportAction -> reports repo -> reports table -> admin moderation UC-66.

import { createClient } from "@/lib/supabase/server"
import { action, parse, unwrap } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { createReportSchema } from "../schemas"
import { insertReport } from "../data/reports.repo"

export type { ReportReasonOption } from "../lib/report-reasons"

export async function createReportAction(input: {
  targetType: string
  targetId: number
  reason: string
  description?: string | null
}): Promise<ActionResult<{ reportId: number }>> {
  return action("reports.errors", async (t) => {
    const data = parse(createReportSchema(t), input)
    const current = await requireCurrentUser()
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
