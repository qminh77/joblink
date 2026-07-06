"use server"

import { getTranslations } from "next-intl/server"

import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  createMemberEducationSchema,
  type MemberEducationInput,
} from "../schemas"
import {
  addEducation,
  deleteEducation,
  editEducation,
} from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function addEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createMemberEducationSchema(await validation()), input)
    const supabase = await createClient()

    await addEducation(supabase, current.appUser.id, data)
    revalidateProfile(current.appUser.id)
  })
}

export async function updateEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createMemberEducationSchema(await validation()), input)
    const supabase = await createClient()

    await editEducation(supabase, current.appUser.id, data)
    revalidateProfile(current.appUser.id)
  })
}

export async function deleteEducationAction(
  educationId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()

    await deleteEducation(supabase, current.appUser.id, educationId)
    revalidateProfile(current.appUser.id)
  })
}
