"use server"

import { writeAuditLog } from "@/lib/audit"
import type { ActionResult } from "@/lib/action/result"
import { action, assertOk, parse } from "@/lib/action/server"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { createPrivacySchema, type PrivacyInput } from "../schemas"
import {
  updateCompanyOpenToHire,
  updateMemberPrivacy,
} from "../data/settings.repo"
import { revalidateSettingsViews } from "./revalidation"

export async function updatePrivacyAction(
  input: PrivacyInput,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const data = parse(createPrivacySchema(), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await updateMemberPrivacy(supabase, current.appUser.id, {
        profileVisibility: data.profileVisibility,
        openToWork: data.openToWork,
      }),
      "unexpected",
    )
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "user.privacy_update",
      entityType: "member_profiles",
      entityId: current.appUser.id,
      newData: {
        profileVisibility: data.profileVisibility,
        openToWork: data.openToWork,
      },
    })
    revalidateSettingsViews()
  })
}

export async function updateCompanyOpenToHireAction(
  openToHire: boolean,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await updateCompanyOpenToHire(supabase, current.appUser.id, openToHire),
      "unexpected",
    )
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.open_to_hire_update",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: { openToHire },
    })
    revalidateSettingsViews()
  })
}
