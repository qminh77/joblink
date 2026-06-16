import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

import type { JobAlertFilters } from "../types"

// Data-access cho job_alerts bằng client RLS (policy own-CRUD — migration 038).

type Supabase = Awaited<ReturnType<typeof createClient>>

export function listJobAlerts(supabase: Supabase, userId: number) {
  return supabase
    .from("job_alerts")
    .select("id, name, filters, alert_enabled, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
}

export function countJobAlerts(supabase: Supabase, userId: number) {
  return supabase
    .from("job_alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
}

export function insertJobAlert(
  supabase: Supabase,
  userId: number,
  name: string,
  filters: JobAlertFilters,
) {
  return supabase
    .from("job_alerts")
    .insert({ user_id: userId, name, filters: filters as unknown as Json })
    .select("id")
    .single<{ id: number }>()
}

export function deleteJobAlert(supabase: Supabase, userId: number, id: number) {
  return supabase.from("job_alerts").delete().eq("id", id).eq("user_id", userId)
}
