"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import type { ActionResult } from "@/lib/action/result"
import { action, assertOk, parse } from "@/lib/action/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { updateUserLocale } from "../data/settings.repo"
import { createLocaleSchema, type LocaleInput } from "../schemas"
import { revalidateSettingsViews } from "./revalidation"

export async function updateLocaleAction(
  input: LocaleInput,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const tv = await getTranslations("settings.validation")
    const data = parse(createLocaleSchema(tv), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await updateUserLocale(supabase, current.appUser.id, data.locale),
      "unexpected",
    )

    try {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      cookieStore.set("NEXT_LOCALE", data.locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    } catch {
      // Cookie sync is best-effort; the DB update is the source of truth.
    }

    await writeAuditLog({
      actorId: current.appUser.id,
      action: "user.locale_update",
      entityType: "users",
      entityId: current.appUser.id,
      newData: { locale: data.locale },
    })
    revalidateSettingsViews()
  })
}
