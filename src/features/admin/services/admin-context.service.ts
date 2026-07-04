import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { CurrentUser } from "@/features/auth/types"

import { requireAdminAccess } from "./admin-access.service"

export type AdminSupabase = ReturnType<typeof createAdminClient>

export async function requireAdminClient(): Promise<AdminSupabase> {
  await requireAdminAccess()
  return createAdminClient()
}

export async function requireAdminContext(): Promise<{
  current: CurrentUser
  supabase: AdminSupabase
}> {
  const current = await requireAdminAccess()
  return { current, supabase: createAdminClient() }
}
