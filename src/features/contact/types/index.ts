export type ContactStatus = "pending" | "read" | "replied" | "closed"

export type ContactSubmissionRow = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  user_id: number | null
  replied_at: string | null
  reply_message: string | null
  replied_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ContactPublicSettings = {
  email: string | null
  phone: string | null
  address: string | null
  content: string | null
  mapUrl: string | null
}

export type ContactSubmissionActionResult =
  | { ok: true }
  | { ok: false; error: string }
