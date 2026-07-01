"use server"

import { action } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  getProfileStats,
  logProfileView,
} from "../services/profile.service"

export async function logProfileViewAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    await logProfileView(supabase, current.appUser.id, targetUserId)
  })
}

export async function getProfileStatsAction(): Promise<{
  profileViewCount: number
  connectionCount: number
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  return getProfileStats(supabase, current.appUser.id)
}
