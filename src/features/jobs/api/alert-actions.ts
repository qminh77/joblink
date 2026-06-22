"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { ActionError, action, assertOk, parse, unwrap } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"

import { createJobAlertSchema } from "../schemas"
import type { JobAlert, JobAlertFilters } from "../types"
import {
  countJobAlerts,
  deleteJobAlert,
  insertJobAlert,
  listJobAlerts,
} from "../data/job-alerts.repo"

const MAX_ALERTS = 20

export async function listJobAlertsAction(): Promise<JobAlert[]> {
  const current = await requirePermission("jobs.view")
  const supabase = await createClient()
  const { data } = await listJobAlerts(supabase, current.appUser.id)
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    filters: (r.filters ?? {}) as JobAlertFilters,
    alertEnabled: r.alert_enabled,
    createdAt: r.created_at,
  }))
}

export async function createJobAlertAction(input: {
  name?: string | null
  filters: JobAlertFilters
}): Promise<ActionResult<{ id: number }>> {
  return action("jobs.errors", async () => {
    const data = parse(createJobAlertSchema, input)
    const current = await requirePermission("jobs.view")
    const supabase = await createClient()

    const { count } = await countJobAlerts(supabase, current.appUser.id)
    if ((count ?? 0) >= MAX_ALERTS) throw ActionError.key("alertLimit")

    const name = data.name?.trim() || "Job alert"
    const row = unwrap(
      await insertJobAlert(supabase, current.appUser.id, name, data.filters),
      "unexpected",
    )
    revalidatePath("/jobs")
    revalidatePath("/saved-jobs")
    return { id: row.id }
  })
}

export async function deleteJobAlertAction(id: number): Promise<ActionResult> {
  return action("jobs.errors", async () => {
    if (!Number.isInteger(id) || id <= 0) throw ActionError.key("invalidAlert")
    const current = await requirePermission("jobs.view")
    const supabase = await createClient()
    assertOk(
      await deleteJobAlert(supabase, current.appUser.id, id),
      "unexpected",
    )
    revalidatePath("/jobs")
    revalidatePath("/saved-jobs")
  })
}
