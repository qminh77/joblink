"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { fail, ok, type ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { createChangePasswordSchema, type ChangePasswordInput } from "../schemas"

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const tv = await getTranslations("settings.validation")
  const tp = await getTranslations("settings.password")

  const parsed = createChangePasswordSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tv("currentPasswordRequired"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const verify = await supabase.auth.signInWithPassword({
    email: current.appUser.email,
    password: parsed.data.currentPassword,
  })
  if (verify.error) return fail(tp("wrongCurrent"))

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (error) {
    console.error("[changePasswordAction]", error)
    return fail(tp("updateFailed"))
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "user.password_change",
    entityType: "users",
    entityId: current.appUser.id,
  })

  return ok(undefined)
}
