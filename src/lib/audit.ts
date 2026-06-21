import "server-only"

import { headers } from "next/headers"

import { createAdminClient } from "@/lib/supabase/admin"

export type AuditLogInput = {
  actorId: number
  action: string
  entityType?: string | null
  entityId?: number | null
  oldData?: unknown
  newData?: unknown
  reason?: string | null
}

/**
 * Write an audit log entry. Used by both admin and user-facing server actions.
 * Uses the admin client (service role) to bypass RLS for reliable writes.
 * O(1) — single INSERT with no additional queries.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const supabase = createAdminClient()
  let ip: string | null = null
  let ua: string | null = null
  try {
    const h = await headers()
    ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null
    ua = h.get("user-agent")
  } catch {
    // not in a request context (e.g. background job)
  }

  await supabase.from("audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    old_data: (input.oldData ?? null) as never,
    new_data: (input.newData ?? null) as never,
    reason: input.reason ?? null,
    ip_address: ip,
    user_agent: ua,
  })
}
