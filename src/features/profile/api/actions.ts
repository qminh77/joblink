"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import {
  ActionError,
  action,
  assertOk,
  parse,
  requireRole,
} from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"

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
import { normalizeDate } from "../lib/normalize"
import {
  deleteMemberSkill,
  insertEducation,
  insertExperience,
  insertMemberSkill,
  insertProfileViewLog,
  loadProfileStats,
  softDeleteEducation,
  softDeleteExperience,
  updateCompanyProfile,
  updateEducation,
  updateExperience,
  updateMemberMedia,
  updateMemberProfile,
} from "../data/profile.repo"

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
    assertOk(
      await updateMemberProfile(supabase, current.appUser.id, data),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

// Cập nhật riêng avatar/cover — gọi sau khi client upload xong file lên storage,
// để không phải submit cả BasicInfoForm chỉ vì đổi ảnh.
export async function updateMemberMediaAction(input: {
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    if (input.avatarUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()
    assertOk(
      await updateMemberMedia(supabase, current.appUser.id, input),
      "unexpected",
    )
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

    const startDate = normalizeDate(data.startDate)
    if (!startDate) throw ActionError.text(tv("startDateRequired"))
    const endDate = data.isCurrent ? null : normalizeDate(data.endDate)

    const supabase = await createClient()
    assertOk(
      await insertExperience(supabase, current.appUser.id, {
        companyName: data.companyName,
        position: data.position,
        startDate,
        endDate,
        isCurrent: data.isCurrent,
        description: data.description,
      }),
      "unexpected",
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
    if (!data.id) throw ActionError.key("missingId")

    const startDate = normalizeDate(data.startDate)
    if (!startDate) throw ActionError.text(tv("startDateRequired"))
    const endDate = data.isCurrent ? null : normalizeDate(data.endDate)

    const supabase = await createClient()
    assertOk(
      await updateExperience(supabase, data.id, current.appUser.id, {
        companyName: data.companyName,
        position: data.position,
        startDate,
        endDate,
        isCurrent: data.isCurrent,
        description: data.description,
      }),
      "unexpected",
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
    assertOk(
      await softDeleteExperience(supabase, experienceId, current.appUser.id),
      "unexpected",
    )
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
    assertOk(
      await insertEducation(supabase, current.appUser.id, data),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function updateEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createMemberEducationSchema(await validation()), input)
    if (!data.id) throw ActionError.key("missingId")
    const supabase = await createClient()
    assertOk(
      await updateEducation(supabase, data.id, current.appUser.id, data),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function deleteEducationAction(
  educationId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await softDeleteEducation(supabase, educationId, current.appUser.id),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function addSkillAction(skillName: string): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const name = parse(createSkillNameSchema(await validation()), skillName)
    const supabase = await createClient()

    assertOk(
      await insertMemberSkill(supabase, current.appUser.id, name),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function removeSkillAction(
  skillId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await deleteMemberSkill(supabase, current.appUser.id, skillId),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function logProfileViewAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireCurrentUser()
    if (current.appUser.id === targetUserId) return
    const supabase = await createClient()
    assertOk(
      await insertProfileViewLog(supabase, targetUserId, current.appUser.id),
      "unexpected",
    )
  })
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("company")
    const data = parse(createCompanyProfileSchema(await validation()), input)
    const supabase = await createClient()
    assertOk(
      await updateCompanyProfile(supabase, current.appUser.id, data),
      "unexpected",
    )
    revalidateProfile(current.appUser.id)
  })
}

export async function getProfileStatsAction(): Promise<{
  profileViewCount: number
  connectionCount: number
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  return loadProfileStats(supabase, current.appUser.id)
}
