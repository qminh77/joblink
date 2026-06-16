import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { AppealStatus } from "@/types/database"

// Data-access cho appeals bằng client RLS. Policy appeals_select_own /
// appeals_insert_own cho phép user đọc & tạo đơn khiếu nại của CHÍNH MÌNH
// (appellant_id = mình).

type Supabase = Awaited<ReturnType<typeof createClient>>

export type MyAppealRow = {
  id: number
  moderation_action_id: number | null
  reason: string
  status: AppealStatus
  created_at: string
  reviewed_at: string | null
}

export function listMyAppeals(supabase: Supabase, userId: number) {
  return supabase
    .from("appeals")
    .select("id, moderation_action_id, reason, status, created_at, reviewed_at")
    .eq("appellant_id", userId)
    .order("created_at", { ascending: false })
}

export function findMyAppealForAction(
  supabase: Supabase,
  userId: number,
  actionId: number,
) {
  return supabase
    .from("appeals")
    .select("id")
    .eq("appellant_id", userId)
    .eq("moderation_action_id", actionId)
    .limit(1)
    .maybeSingle<{ id: number }>()
}

export function insertAppeal(
  supabase: Supabase,
  values: { appellantId: number; moderationActionId: number; reason: string },
) {
  return supabase
    .from("appeals")
    .insert({
      appellant_id: values.appellantId,
      report_id: null,
      moderation_action_id: values.moderationActionId,
      reason: values.reason,
    })
    .select("id")
    .single<{ id: number }>()
}
