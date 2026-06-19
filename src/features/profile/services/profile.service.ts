import "server-only"

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
}

export async function updateMemberMedia(
  supabase: Supabase,
  userId: number,
  input: { avatarUrl?: string | null; coverUrl?: string | null },
) {
  assertOk(await updateMemberMediaRow(supabase, userId, input), "unexpected")
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
}

export async function addEducation(
  supabase: Supabase,
  userId: number,
  input: MemberEducationInput,
) {
  assertOk(await insertEducation(supabase, userId, input), "unexpected")
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
}

export async function addSkill(
  supabase: Supabase,
  userId: number,
  skillName: string,
) {
  assertOk(await insertMemberSkill(supabase, userId, skillName), "unexpected")
}

export async function removeSkill(
  supabase: Supabase,
  userId: number,
  skillId: number,
) {
  assertOk(await deleteMemberSkill(supabase, userId, skillId), "unexpected")
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

export async function updateCompanyProfile(
  supabase: Supabase,
  userId: number,
  input: CompanyProfileInput,
) {
  assertOk(await updateCompanyProfileRow(supabase, userId, input), "unexpected")
}

export function getProfileStats(supabase: Supabase, userId: number) {
  return loadProfileStats(supabase, userId)
}
