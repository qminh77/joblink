"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { createSkillNameSchema } from "../schemas"
import { addSkill, removeSkill } from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function addSkillAction(skillName: string): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const name = parse(createSkillNameSchema(await validation()), skillName)
    const supabase = await createClient()

    await addSkill(supabase, current.appUser.id, name)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.skill_add",
      entityType: "member_skills",
      newData: { name },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function removeSkillAction(
  skillId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await removeSkill(supabase, current.appUser.id, skillId)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.skill_remove",
      entityType: "member_skills",
      entityId: skillId,
    })
    revalidateProfile(current.appUser.id)
  })
}
