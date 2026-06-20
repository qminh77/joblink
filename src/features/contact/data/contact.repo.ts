import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ContactSubmissionRow, ContactStatus } from "../types"

export async function insertContactSubmission(input: {
  name: string
  email: string
  subject: string
  message: string
  userId: number | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("contact_submissions").insert({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      user_id: input.userId,
      status: "pending",
      replied_at: null,
      reply_message: null,
      replied_by: null,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: "unexpected_error" }
  }
}

export async function listContactSubmissions(): Promise<ContactSubmissionRow[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("contact_submissions")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
  return (data ?? []) as ContactSubmissionRow[]
}

export async function updateContactStatus(
  id: number,
  status: ContactStatus,
  replyMessage?: string,
  repliedBy?: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient()
    const update: Partial<ContactSubmissionRow> = { status }
    if (replyMessage) {
      update.reply_message = replyMessage
      update.replied_by = repliedBy ?? null
      update.replied_at = new Date().toISOString()
    }
    const { error } = await supabase
      .from("contact_submissions")
      .update(update)
      .eq("id", id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: "unexpected_error" }
  }
}
