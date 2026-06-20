"use server"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { loadPublicAuthSettings } from "@/features/system-settings/api/public-settings"

import { contactFormSchema } from "../schemas"
import { insertContactSubmission } from "../data/contact.repo"
import type { ContactSubmissionActionResult } from "../types"

export async function submitContactForm(
  formData: FormData,
): Promise<ContactSubmissionActionResult> {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string
  const recaptchaToken = formData.get("recaptchaToken") as string | null

  const parsed = contactFormSchema.safeParse({ name, email, subject, message })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first.message }
  }

  const recaptcha = await loadPublicAuthSettings()
  if (recaptcha.recaptcha.enabled && recaptcha.recaptcha.siteKey) {
    if (!recaptchaToken) return { ok: false, error: "recaptcha_required" }
    try {
      const verifyUrl = "https://www.google.com/recaptcha/api/siteverify"
      const params = new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY ?? "",
        response: recaptchaToken,
      })
      const res = await fetch(verifyUrl, { method: "POST", body: params })
      const data = (await res.json()) as { success: boolean; score?: number }
      if (!data.success || (data.score != null && data.score < 0.5)) {
        return { ok: false, error: "recaptcha_failed" }
      }
    } catch {
      return { ok: false, error: "recaptcha_failed" }
    }
  }

  let userId: number | null = null
  try {
    const user = await getCurrentUser()
    userId = user?.appUser.id ?? null
  } catch {
    // not logged in — allowed
  }

  return insertContactSubmission({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    userId,
  })
}
