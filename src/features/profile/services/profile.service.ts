import "server-only"

import { writeAuditLog } from "@/lib/audit"
import { ActionError, assertOk } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"

import {
  deleteMemberSkill,
  insertEducation,
  insertExperience,
  insertMemberSkill,
  insertProfileViewLog,
  loadProfileStats,
  softDeleteEducation,
  softDeleteExperience,
  updateCompanyMedia as updateCompanyMediaRow,
  updateCompanyProfile as updateCompanyProfileRow,
  updateEducation,
  updateExperience,
  updateMemberMedia as updateMemberMediaRow,
  updateMemberProfile as updateMemberProfileRow,
} from "../data/profile.repo"
import { normalizeDate } from "../lib/normalize"
import type {
  CompanyProfileInput,
  MemberEducationInput,
  MemberExperienceInput,
  MemberProfileInput,
} from "../schemas"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function updateMemberProfile(
  supabase: Supabase,
  userId: number,
  input: MemberProfileInput,
) {
  assertOk(await updateMemberProfileRow(supabase, userId, input), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "profile.update",
    entityType: "member_profiles",
    entityId: userId,
    newData: { fullName: input.fullName, headline: input.headline },
  })
}

export async function updateMemberMedia(
  supabase: Supabase,
  userId: number,
  input: { avatarUrl?: string | null; coverUrl?: string | null },
) {
  assertOk(await updateMemberMediaRow(supabase, userId, input), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "profile.media_update",
    entityType: "member_profiles",
    entityId: userId,
    newData: input,
  })
}

export async function addExperience(
  supabase: Supabase,
  userId: number,
  input: MemberExperienceInput,
  startDateRequiredMessage: string,
) {
  const startDate = normalizeDate(input.startDate)
  if (!startDate) throw ActionError.text(startDateRequiredMessage)

  assertOk(
    await insertExperience(supabase, userId, {
      companyName: input.companyName,
      position: input.position,
      startDate,
      endDate: input.isCurrent ? null : normalizeDate(input.endDate),
      isCurrent: input.isCurrent,
      description: input.description,
    }),
    "unexpected",
  )
  await writeAuditLog({
    actorId: userId,
    action: "profile.experience_add",
    entityType: "member_experiences",
    newData: { companyName: input.companyName, position: input.position },
  })
}

export async function editExperience(
  supabase: Supabase,
  userId: number,
  input: MemberExperienceInput,
  startDateRequiredMessage: string,
) {
  if (!input.id) throw ActionError.key("missingId")
  const startDate = normalizeDate(input.startDate)
  if (!startDate) throw ActionError.text(startDateRequiredMessage)

  assertOk(
    await updateExperience(supabase, input.id, userId, {
      companyName: input.companyName,
      position: input.position,
      startDate,
      endDate: input.isCurrent ? null : normalizeDate(input.endDate),
      isCurrent: input.isCurrent,
      description: input.description,
    }),
    "unexpected",
  )
  await writeAuditLog({
    actorId: userId,
    action: "profile.experience_update",
    entityType: "member_experiences",
    entityId: input.id ?? undefined,
    newData: { companyName: input.companyName, position: input.position },
  })
}

export async function deleteExperience(
  supabase: Supabase,
  userId: number,
  experienceId: number,
) {
  assertOk(
    await softDeleteExperience(supabase, experienceId, userId),
    "unexpected",
  )
  await writeAuditLog({
    actorId: userId,
    action: "profile.experience_delete",
    entityType: "member_experiences",
    entityId: experienceId,
  })
}

export async function addEducation(
  supabase: Supabase,
  userId: number,
  input: MemberEducationInput,
) {
  assertOk(await insertEducation(supabase, userId, input), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "profile.education_add",
    entityType: "member_educations",
    newData: { schoolName: input.schoolName, degree: input.degree },
  })
}

export async function editEducation(
  supabase: Supabase,
  userId: number,
  input: MemberEducationInput,
) {
  if (!input.id) throw ActionError.key("missingId")
  assertOk(
    await updateEducation(supabase, input.id, userId, input),
    "unexpected",
  )
  await writeAuditLog({
    actorId: userId,
    action: "profile.education_update",
    entityType: "member_educations",
    entityId: input.id ?? undefined,
    newData: { schoolName: input.schoolName, degree: input.degree },
  })
}

export async function deleteEducation(
  supabase: Supabase,
  userId: number,
  educationId: number,
) {
  assertOk(
    await softDeleteEducation(supabase, educationId, userId),
    "unexpected",
  )
  await writeAuditLog({
    actorId: userId,
    action: "profile.education_delete",
    entityType: "member_educations",
    entityId: educationId,
  })
}

export async function addSkill(
  supabase: Supabase,
  userId: number,
  skillName: string,
) {
  assertOk(await insertMemberSkill(supabase, userId, skillName), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "profile.skill_add",
    entityType: "member_skills",
    newData: { name: skillName },
  })
}

export async function removeSkill(
  supabase: Supabase,
  userId: number,
  skillId: number,
) {
  assertOk(await deleteMemberSkill(supabase, userId, skillId), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "profile.skill_remove",
    entityType: "member_skills",
    entityId: skillId,
  })
}

export async function logProfileView(
  supabase: Supabase,
  viewerId: number,
  targetUserId: number,
) {
  if (viewerId === targetUserId) return
  assertOk(
    await insertProfileViewLog(supabase, targetUserId, viewerId),
    "unexpected",
  )
}

export async function updateCompanyMedia(
  supabase: Supabase,
  userId: number,
  input: { logoUrl?: string | null; coverUrl?: string | null },
) {
  assertOk(await updateCompanyMediaRow(supabase, userId, input), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "company.media_update",
    entityType: "company_profiles",
    entityId: userId,
    newData: input,
  })
}

export async function updateCompanyProfile(
  supabase: Supabase,
  userId: number,
  input: CompanyProfileInput,
) {
  assertOk(await updateCompanyProfileRow(supabase, userId, input), "unexpected")
  await writeAuditLog({
    actorId: userId,
    action: "company.profile_update",
    entityType: "company_profiles",
    entityId: userId,
    newData: { name: input.name, industry: input.industry },
  })
}

export function getProfileStats(supabase: Supabase, userId: number) {
  return loadProfileStats(supabase, userId)
}
