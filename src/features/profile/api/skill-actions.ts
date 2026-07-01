"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createSkillNameSchema } from "../schemas"
import { addSkill, removeSkill } from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function addSkillAction(skillName: string): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
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
    const current = await requirePermission("profile.edit")
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
