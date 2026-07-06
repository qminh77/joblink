"use server"

import { getTranslations } from "next-intl/server"

import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  createMemberExperienceSchema,
  type MemberExperienceInput,
} from "../schemas"
import {
  addExperience,
  deleteExperience,
  editExperience,
} from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function addExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const tv = await validation()
    const data = parse(createMemberExperienceSchema(tv), input)
    const supabase = await createClient()

    await addExperience(
      supabase,
      current.appUser.id,
      data,
      tv("startDateRequired"),
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function updateExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const tv = await validation()
    const data = parse(createMemberExperienceSchema(tv), input)
    const supabase = await createClient()

    await editExperience(
      supabase,
      current.appUser.id,
      data,
      tv("startDateRequired"),
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function deleteExperienceAction(
  experienceId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await deleteExperience(supabase, current.appUser.id, experienceId)
    revalidateProfile(current.appUser.id)
  })
}
