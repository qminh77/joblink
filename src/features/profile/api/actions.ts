"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { action, parse } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { requirePermission } from "@/lib/rbac"
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
  updateCompanyMedia,
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

export async function updateCompanyMediaAction(input: {
  logoUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    if (input.logoUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()

    await updateCompanyMedia(supabase, current.appUser.id, input)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.media_update",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: input,
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function addExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const tv = await validation()
    const data = parse(createMemberExperienceSchema(tv), input)
    const supabase = await createClient()

    await addExperience(
      supabase,
      current.appUser.id,
      data,
      tv("startDateRequired"),
    )
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.experience_add",
      entityType: "member_experiences",
      newData: { companyName: data.companyName, position: data.position },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function updateExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const tv = await validation()
    const data = parse(createMemberExperienceSchema(tv), input)
    const supabase = await createClient()

    await editExperience(
      supabase,
      current.appUser.id,
      data,
      tv("startDateRequired"),
    )
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.experience_update",
      entityType: "member_experiences",
      entityId: data.id ?? undefined,
      newData: { companyName: data.companyName, position: data.position },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function deleteExperienceAction(
  experienceId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const supabase = await createClient()

    await deleteExperience(supabase, current.appUser.id, experienceId)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.experience_delete",
      entityType: "member_experiences",
      entityId: experienceId,
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function addEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const data = parse(createMemberEducationSchema(await validation()), input)
    const supabase = await createClient()

    await addEducation(supabase, current.appUser.id, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.education_add",
      entityType: "member_educations",
      newData: { schoolName: data.schoolName, degree: data.degree },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function updateEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const data = parse(createMemberEducationSchema(await validation()), input)
    const supabase = await createClient()

    await editEducation(supabase, current.appUser.id, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.education_update",
      entityType: "member_educations",
      entityId: data.id ?? undefined,
      newData: { schoolName: data.schoolName, degree: data.degree },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function deleteEducationAction(
  educationId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const supabase = await createClient()

    await deleteEducation(supabase, current.appUser.id, educationId)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "profile.education_delete",
      entityType: "member_educations",
      entityId: educationId,
    })
    revalidateProfile(current.appUser.id)
  })
}

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

export async function logProfileViewAction(
  targetUserId: number,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.view")
    const supabase = await createClient()
    await logProfileView(supabase, current.appUser.id, targetUserId)
  })
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requirePermission("profile.edit")
    const data = parse(createCompanyProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateCompanyProfile(supabase, current.appUser.id, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.profile_update",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: { name: data.name, industry: data.industry },
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function getProfileStatsAction(): Promise<{
  profileViewCount: number
  connectionCount: number
}> {
  const current = await requirePermission("profile.view")
  const supabase = await createClient()
  return getProfileStats(supabase, current.appUser.id)
}
