"use server"

import { revalidatePath } from "next/cache"

import { requireAdminPermission } from "@/features/admin/api/admin-guard"
import { writeAuditLog } from "@/features/admin/api/audit-log"

import { contactReplySchema } from "../schemas"
import {
  listContactSubmissions,
  updateContactStatus,
} from "../data/contact.repo"
import type { ContactSubmissionActionResult } from "../types"

export async function loadContactSubmissions() {
  await requireAdminPermission("contacts.view")
  return listContactSubmissions()
}

export async function replyContactSubmission(
  input: { id: number; replyMessage: string },
): Promise<ContactSubmissionActionResult> {
  const current = await requireAdminPermission("contacts.reply")
  const parsed = contactReplySchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first.message }
  }

  const result = await updateContactStatus(
    parsed.data.id,
    "replied",
    parsed.data.replyMessage,
    current.appUser.id,
  )
  if (!result.ok) return result

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "contact.reply",
    entityType: "contact_submissions",
    entityId: parsed.data.id,
    newData: { replyMessage: parsed.data.replyMessage },
  })

  revalidatePath("/admin/contact-submissions")
  return { ok: true }
}

export async function closeContactSubmission(
  id: number,
): Promise<ContactSubmissionActionResult> {
  const current = await requireAdminPermission("contacts.reply")
  const result = await updateContactStatus(id, "closed")
  if (!result.ok) return result

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "contact.close",
    entityType: "contact_submissions",
    entityId: id,
  })

  revalidatePath("/admin/contact-submissions")
  return { ok: true }
}
