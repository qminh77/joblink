"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"

import {
  createCompanyProfileSchema,
  createMemberEducationSchema,
  createMemberExperienceSchema,
  createMemberProfileSchema,
  createSkillNameSchema,
  type CompanyProfileInput,
  type MemberEducationInput,
  type MemberExperienceInput,
  type MemberProfileInput,
} from "../schemas"
import {
  addEducation,
  addExperience,
  addSkill,
  deleteEducation,
  deleteExperience,
  editEducation,
  editExperience,
  getProfileStats,
  logProfileView,
  removeSkill,
  updateCompanyProfile,
  updateMemberMedia,
  updateMemberProfile,
} from "../services/profile.service"

const validation = () => getTranslations("profile.validation")

function revalidateProfile(userId: number) {
  revalidatePath("/profile/edit")
  revalidatePath(`/profile/${userId}`)
  revalidatePath("/profile/me")
  revalidatePath("/settings")
  revalidatePath("/home")
}

export async function updateMemberProfileAction(
  input: MemberProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createMemberProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateMemberProfile(supabase, current.appUser.id, data)
    revalidateProfile(current.appUser.id)
  })
}

export async function updateMemberMediaAction(input: {
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    if (input.avatarUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()

    await updateMemberMedia(supabase, current.appUser.id, input)
    revalidateProfile(current.appUser.id)
  })
}

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

export async function addSkillAction(skillName: string): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const name = parse(createSkillNameSchema(await validation()), skillName)
    const supabase = await createClient()

    await addSkill(supabase, current.appUser.id, name)
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
    revalidateProfile(current.appUser.id)
  })
}

export async function logProfileViewAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    await logProfileView(supabase, current.appUser.id, targetUserId)
  })
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("company")
    const data = parse(createCompanyProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateCompanyProfile(supabase, current.appUser.id, data)
    revalidateProfile(current.appUser.id)
  })
}

export async function getProfileStatsAction(): Promise<{
  profileViewCount: number
  connectionCount: number
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  return getProfileStats(supabase, current.appUser.id)
}
