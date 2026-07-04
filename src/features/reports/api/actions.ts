"use server"

// SRS UC Trace - M08 UC-60 Gui bao cao vi pham.
// Flow: report dialog -> createReportAction facade -> reports service/repo -> admin moderation UC-66.

import { createClient } from "@/lib/supabase/server"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { createReportSchema } from "../schemas"
import { submitReport } from "../services/report-submission.service"

export type { ReportReasonOption } from "../types"

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

    return submitReport(supabase, current.appUser.id, data)
  })
}
