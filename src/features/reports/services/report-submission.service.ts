import "server-only"

import { unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import { insertReport } from "../data/reports.repo"
import type { ReportInput } from "../schemas"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function submitReport(
  supabase: Supabase,
  reporterId: number,
  input: ReportInput,
): Promise<{ reportId: number }> {
  const row = unwrap(
    await insertReport(supabase, {
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description ?? null,
    }),
    "createFailed",
  )

  return { reportId: row.id }
}
