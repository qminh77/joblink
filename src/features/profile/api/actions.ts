"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
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

type ActionResult<TData = void> =
  | { ok: true; data: TData }
  | { ok: false; error: string }

function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function normalizeDate(value: string | null | undefined): string | null {
  const cleaned = emptyToNull(value)
  if (!cleaned) return null
  if (/^\d{4}-\d{2}$/.test(cleaned)) return `${cleaned}-01`
  return cleaned
}

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
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createMemberProfileSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_profiles")
    .update({
      full_name: parsed.data.fullName,
      headline: emptyToNull(parsed.data.headline),
      about: emptyToNull(parsed.data.about),
      website: emptyToNull(parsed.data.website),
      province_id: parsed.data.provinceId ?? null,
      district_id: parsed.data.districtId ?? null,
      profile_visibility: parsed.data.profileVisibility,
      open_to_work: parsed.data.openToWork,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

// Cập nhật riêng avatar/cover — gọi sau khi client upload xong file lên storage.
// Tách action riêng để không phải submit toàn bộ BasicInfoForm chỉ để đổi ảnh.
export async function updateMemberMediaAction(input: {
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  const te = await getTranslations("profile.errors")
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const patch: {
    avatar_url?: string | null
    cover_url?: string | null
    updated_at?: string
  } = {}
  if (input.avatarUrl !== undefined) patch.avatar_url = emptyToNull(input.avatarUrl)
  if (input.coverUrl !== undefined) patch.cover_url = emptyToNull(input.coverUrl)
  if (Object.keys(patch).length === 0) return ok(undefined)
  patch.updated_at = new Date().toISOString()

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_profiles")
    .update(patch)
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function addExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createMemberExperienceSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const startDate = normalizeDate(parsed.data.startDate)
  if (!startDate) return fail(tv("startDateRequired"))
  const endDate = parsed.data.isCurrent
    ? null
    : normalizeDate(parsed.data.endDate)

  const { error } = await supabase.from("member_experiences").insert({
    user_id: current.appUser.id,
    company_name: parsed.data.companyName,
    position: parsed.data.position,
    start_date: startDate,
    end_date: endDate,
    is_current: parsed.data.isCurrent,
    description: emptyToNull(parsed.data.description),
  })

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function updateExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  if (!input.id) return fail(te("missingId"))

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createMemberExperienceSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const startDate = normalizeDate(parsed.data.startDate)
  if (!startDate) return fail(tv("startDateRequired"))
  const endDate = parsed.data.isCurrent
    ? null
    : normalizeDate(parsed.data.endDate)

  const { error } = await supabase
    .from("member_experiences")
    .update({
      company_name: parsed.data.companyName,
      position: parsed.data.position,
      start_date: startDate,
      end_date: endDate,
      is_current: parsed.data.isCurrent,
      description: emptyToNull(parsed.data.description),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id!)
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function deleteExperienceAction(
  experienceId: number,
): Promise<ActionResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("member_experiences")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", experienceId)
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function addEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createMemberEducationSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const { error } = await supabase.from("member_educations").insert({
    user_id: current.appUser.id,
    school_name: parsed.data.schoolName,
    degree: emptyToNull(parsed.data.degree),
    field_of_study: emptyToNull(parsed.data.fieldOfStudy),
    start_date: normalizeDate(parsed.data.startDate),
    end_date: normalizeDate(parsed.data.endDate),
    description: emptyToNull(parsed.data.description),
  })

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function updateEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  if (!input.id) return fail(te("missingId"))
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createMemberEducationSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_educations")
    .update({
      school_name: parsed.data.schoolName,
      degree: emptyToNull(parsed.data.degree),
      field_of_study: emptyToNull(parsed.data.fieldOfStudy),
      start_date: normalizeDate(parsed.data.startDate),
      end_date: normalizeDate(parsed.data.endDate),
      description: emptyToNull(parsed.data.description),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id!)
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function deleteEducationAction(
  educationId: number,
): Promise<ActionResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("member_educations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", educationId)
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function addSkillAction(
  skillName: string,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") return fail(te("memberOnly"))

  const parsed = createSkillNameSchema(tv).safeParse(skillName)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tv("skillNameRequired"))
  }

  const supabase = await createClient()
  const normalized = parsed.data

  const { data: existing } = await supabase
    .from("skills")
    .select("id")
    .ilike("name", normalized)
    .maybeSingle<{ id: number }>()

  let skillId = existing?.id
  if (!skillId) {
    const { data: created, error: insertError } = await supabase
      .from("skills")
      .insert({ name: normalized })
      .select("id")
      .single<{ id: number }>()
    if (insertError) return fail(insertError.message)
    skillId = created.id
  }

  const { error } = await supabase.from("member_skills").upsert(
    {
      user_id: current.appUser.id,
      skill_id: skillId,
      endorsement_count: 0,
    },
    { onConflict: "user_id,skill_id" },
  )

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function removeSkillAction(
  skillId: number,
): Promise<ActionResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("member_skills")
    .delete()
    .eq("user_id", current.appUser.id)
    .eq("skill_id", skillId)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function logProfileViewAction(
  targetUserId: number,
): Promise<ActionResult> {
  const current = await requireCurrentUser()
  if (current.appUser.id === targetUserId) return ok(undefined)

  const supabase = await createClient()
  const { error } = await supabase.from("profile_view_logs").insert({
    target_user_id: targetUserId,
    viewer_user_id: current.appUser.id,
  })

  if (error) return fail(error.message)
  return ok(undefined)
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<ActionResult> {
  const tv = await getTranslations("profile.validation")
  const te = await getTranslations("profile.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "company") return fail(te("companyOnly"))

  const parsed = createCompanyProfileSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? te("invalidData"))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("company_profiles")
    .update({
      name: parsed.data.name,
      about: emptyToNull(parsed.data.about),
      logo_url: emptyToNull(parsed.data.logoUrl),
      website: emptyToNull(parsed.data.website),
      industry: emptyToNull(parsed.data.industry),
      size: emptyToNull(parsed.data.size),
      province_id: parsed.data.provinceId ?? null,
      district_id: parsed.data.districtId ?? null,
      open_to_hire: parsed.data.openToHire,
      business_address: emptyToNull(parsed.data.businessAddress),
      business_email: emptyToNull(parsed.data.businessEmail),
      representative_name: emptyToNull(parsed.data.representativeName),
      representative_title: emptyToNull(parsed.data.representativeTitle),
      tax_id: emptyToNull(parsed.data.taxId),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function getProfileStatsAction(): Promise<{
  profileViewCount: number
  connectionCount: number
}> {
  const current = await requireCurrentUser()
  const supabase = await createClient()
  const userId = current.appUser.id

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
