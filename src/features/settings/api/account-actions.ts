"use server"

import { getTranslations } from "next-intl/server"

import { sendEmailChangeVerification } from "@/features/auth/api/auth-mailer"
import { writeAuditLog } from "@/lib/audit"
import type { ActionResult } from "@/lib/action/result"
import { ActionError, action, assertOk, parse } from "@/lib/action/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { updateUserPhone } from "../data/settings.repo"
import { createAccountSchema, type AccountInput } from "../schemas"
import { revalidateSettingsViews } from "./revalidation"

export async function updateAccountAction(
  input: AccountInput,
): Promise<ActionResult<{ emailChangeRequested: boolean }>> {
  return action("settings.errors", async () => {
    const tv = await getTranslations("settings.validation")
    const data = parse(createAccountSchema(tv), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    let emailChangeRequested = false
    const newEmail = data.email.trim().toLowerCase()
    if (newEmail !== current.appUser.email.toLowerCase()) {
      emailChangeRequested = await requestEmailChange(
        current.appUser.email,
        newEmail,
      )
    }

    const newPhone = data.phone?.trim() ? data.phone.trim() : null
    if (newPhone !== (current.appUser.phone ?? null)) {
      assertOk(
        await updateUserPhone(supabase, current.appUser.id, newPhone),
        "unexpected",
      )
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "user.phone_update",
        entityType: "users",
        entityId: current.appUser.id,
        oldData: { phone: current.appUser.phone },
        newData: { phone: newPhone },
      })
    }

    revalidateSettingsViews()
    return { emailChangeRequested }
  })
}

async function requestEmailChange(currentEmail: string, newEmail: string) {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value
  const sent = await sendEmailChangeVerification(
    currentEmail,
    newEmail,
    localeCookie === "en" ? "en" : "vi",
  )
  if (!sent.ok) {
    throw ActionError.key(
      sent.code === "email_exists" ? "emailInUse" : "emailUpdateFailed",
    )
  }
  return true
}
