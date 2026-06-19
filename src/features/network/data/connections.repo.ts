import "server-only"

import type { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ConnectionRow } from "@/types/database"

// Data-access cho connections, chạy bằng client RLS. Truy vấn lookup 2 chiều
// (requester/receiver) gói gọn ở đây để action không lặp chuỗi `or(...)`.

type Supabase = Awaited<ReturnType<typeof createClient>>

type ConnectionCore = Pick<
  ConnectionRow,
  "id" | "status" | "requester_id" | "receiver_id"
>

const now = () => new Date().toISOString()

function betweenFilter(me: number, other: number): string {
  return (
    `and(requester_id.eq.${me},receiver_id.eq.${other}),` +
    `and(requester_id.eq.${other},receiver_id.eq.${me})`
  )
}

export function getConnectTarget(supabase: Supabase, userId: number) {
  const admin = createAdminClient()
  return admin
    .from("users")
    .select("id, status, role")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; status: string; role: string }>()
}

export function findConnectionBetween(
  supabase: Supabase,
  me: number,
  other: number,
) {
  return supabase
    .from("connections")
    .select("id, status, requester_id, receiver_id")
    .or(betweenFilter(me, other))
    .limit(1)
    .maybeSingle<ConnectionCore>()
}

export function getConnectionById(supabase: Supabase, id: number) {
  return supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .eq("id", id)
    .maybeSingle<ConnectionCore>()
}

export function reactivateRejectedConnection(
  supabase: Supabase,
  id: number,
  me: number,
  other: number,
) {
  return supabase
    .from("connections")
    .update({
      requester_id: me,
      receiver_id: other,
      status: "pending",
      requested_at: now(),
      responded_at: null,
    })
    .eq("id", id)
}

export function insertConnection(
  supabase: Supabase,
  me: number,
  other: number,
) {
  return supabase
    .from("connections")
    .insert({ requester_id: me, receiver_id: other, status: "pending" })
    .select("id")
    .single<{ id: number }>()
}

export function updateConnectionStatus(
  supabase: Supabase,
  id: number,
  status: "accepted" | "rejected",
) {
  return supabase
    .from("connections")
    .update({ status, responded_at: now() })
    .eq("id", id)
}

export function deleteConnection(supabase: Supabase, id: number) {
  return supabase.from("connections").delete().eq("id", id)
}
