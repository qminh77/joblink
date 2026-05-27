import "server-only"

import type { createClient } from "@/lib/supabase/server"

import type {
  CompanyProfileInput,
  MemberEducationInput,
  MemberProfileInput,
} from "../schemas"
import { emptyToNull, normalizeDate } from "../lib/normalize"

// Lớp data-access của profile: nơi duy nhất biết bảng/cột + ánh xạ domain
// (camelCase) → cột DB (snake_case) kèm chuẩn hoá empty→null. Chạy bằng client
// RLS. KHÔNG auth/i18n ở đây.

type Supabase = Awaited<ReturnType<typeof createClient>>

const now = () => new Date().toISOString()

export function updateMemberProfile(
  supabase: Supabase,
  userId: number,
  input: MemberProfileInput,
) {
  return supabase
    .from("member_profiles")
    .update({
      full_name: input.fullName,
      headline: emptyToNull(input.headline),
      about: emptyToNull(input.about),
      website: emptyToNull(input.website),
      province_id: input.provinceId ?? null,
      district_id: input.districtId ?? null,
      profile_visibility: input.profileVisibility,
      open_to_work: input.openToWork,
      updated_at: now(),
    })
    .eq("user_id", userId)
}

export function updateMemberMedia(
  supabase: Supabase,
  userId: number,
  input: { avatarUrl?: string | null; coverUrl?: string | null },
) {
  const patch: {
    avatar_url?: string | null
    cover_url?: string | null
    updated_at: string
  } = { updated_at: now() }
  if (input.avatarUrl !== undefined) patch.avatar_url = emptyToNull(input.avatarUrl)
  if (input.coverUrl !== undefined) patch.cover_url = emptyToNull(input.coverUrl)
  return supabase.from("member_profiles").update(patch).eq("user_id", userId)
}

type ExperienceValues = {
  companyName: string
  position: string
  startDate: string
  endDate: string | null
  isCurrent: boolean
  description: string
}

export function insertExperience(
  supabase: Supabase,
  userId: number,
  v: ExperienceValues,
) {
  return supabase.from("member_experiences").insert({
    user_id: userId,
    company_name: v.companyName,
    position: v.position,
    start_date: v.startDate,
    end_date: v.endDate,
    is_current: v.isCurrent,
    description: emptyToNull(v.description),
  })
}

export function updateExperience(
  supabase: Supabase,
  id: number,
  userId: number,
  v: ExperienceValues,
) {
  return supabase
    .from("member_experiences")
    .update({
      company_name: v.companyName,
      position: v.position,
      start_date: v.startDate,
      end_date: v.endDate,
      is_current: v.isCurrent,
      description: emptyToNull(v.description),
      updated_at: now(),
    })
    .eq("id", id)
    .eq("user_id", userId)
}

export function softDeleteExperience(
  supabase: Supabase,
  id: number,
  userId: number,
) {
  return supabase
    .from("member_experiences")
    .update({ deleted_at: now() })
    .eq("id", id)
    .eq("user_id", userId)
}

export function insertEducation(
  supabase: Supabase,
  userId: number,
  input: MemberEducationInput,
) {
  return supabase.from("member_educations").insert({
    user_id: userId,
    school_name: input.schoolName,
    degree: emptyToNull(input.degree),
    field_of_study: emptyToNull(input.fieldOfStudy),
    start_date: normalizeDate(input.startDate),
    end_date: normalizeDate(input.endDate),
    description: emptyToNull(input.description),
  })
}

export function updateEducation(
  supabase: Supabase,
  id: number,
  userId: number,
  input: MemberEducationInput,
) {
  return supabase
    .from("member_educations")
    .update({
      school_name: input.schoolName,
      degree: emptyToNull(input.degree),
      field_of_study: emptyToNull(input.fieldOfStudy),
      start_date: normalizeDate(input.startDate),
      end_date: normalizeDate(input.endDate),
      description: emptyToNull(input.description),
      updated_at: now(),
    })
    .eq("id", id)
    .eq("user_id", userId)
}

export function softDeleteEducation(
  supabase: Supabase,
  id: number,
  userId: number,
) {
  return supabase
    .from("member_educations")
    .update({ deleted_at: now() })
    .eq("id", id)
    .eq("user_id", userId)
}

export function findSkillByName(supabase: Supabase, name: string) {
  return supabase
    .from("skills")
    .select("id")
    .ilike("name", name)
    .maybeSingle<{ id: number }>()
}

export function insertSkill(supabase: Supabase, name: string) {
  return supabase
    .from("skills")
    .insert({ name })
    .select("id")
    .single<{ id: number }>()
}

export function upsertMemberSkill(
  supabase: Supabase,
  userId: number,
  skillId: number,
) {
  return supabase.from("member_skills").upsert(
    { user_id: userId, skill_id: skillId, endorsement_count: 0 },
    { onConflict: "user_id,skill_id" },
  )
}

export function deleteMemberSkill(
  supabase: Supabase,
  userId: number,
  skillId: number,
) {
  return supabase
    .from("member_skills")
    .delete()
    .eq("user_id", userId)
    .eq("skill_id", skillId)
}

export function insertProfileViewLog(
  supabase: Supabase,
  targetUserId: number,
  viewerUserId: number,
) {
  return supabase
    .from("profile_view_logs")
    .insert({ target_user_id: targetUserId, viewer_user_id: viewerUserId })
}

export function updateCompanyProfile(
  supabase: Supabase,
  userId: number,
  input: CompanyProfileInput,
) {
  return supabase
    .from("company_profiles")
    .update({
      name: input.name,
      about: emptyToNull(input.about),
      logo_url: emptyToNull(input.logoUrl),
      website: emptyToNull(input.website),
      phone: emptyToNull(input.phone),
      industry: emptyToNull(input.industry),
      size: emptyToNull(input.size),
      province_id: input.provinceId ?? null,
      district_id: input.districtId ?? null,
      open_to_hire: input.openToHire,
      business_address: emptyToNull(input.businessAddress),
      business_email: emptyToNull(input.businessEmail),
      representative_name: emptyToNull(input.representativeName),
      representative_title: emptyToNull(input.representativeTitle),
      tax_id: emptyToNull(input.taxId),
      updated_at: now(),
    })
    .eq("user_id", userId)
}

export async function loadProfileStats(
  supabase: Supabase,
  userId: number,
): Promise<{ profileViewCount: number; connectionCount: number }> {
  const [{ count: profileViewCount }, { count: connectionCount }] =
    await Promise.all([
      supabase
        .from("profile_view_logs")
        .select("id", { count: "exact", head: true })
        .eq("target_user_id", userId),
      supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted"),
    ])

  return {
    profileViewCount: profileViewCount ?? 0,
    connectionCount: connectionCount ?? 0,
  }
}
