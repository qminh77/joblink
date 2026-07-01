"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import {
  createMemberProfileSchema,
  type MemberProfileInput,
} from "../schemas"
import {
  updateMemberMedia,
  updateMemberProfile,
} from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function updateMemberProfileAction(
  input: MemberProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const data = parse(createMemberProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateMemberProfile(supabase, current.appUser.id, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.update",
      entityType: "member_profiles",
      entityId: current.appUser.id,
      newData: { fullName: data.fullName, headline: data.headline },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function updateMemberMediaAction(input: {
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    if (input.avatarUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()

    await updateMemberMedia(supabase, current.appUser.id, input)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.media_update",
      entityType: "member_profiles",
      entityId: current.appUser.id,
      newData: input,
    })
    revalidateProfile(current.appUser.id)
  })
}
