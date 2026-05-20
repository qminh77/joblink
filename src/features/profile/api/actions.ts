"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  companyProfileSchema,
  memberEducationSchema,
  memberExperienceSchema,
  memberProfileSchema,
  skillNameSchema,
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
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể cập nhật hồ sơ này")
  }

  const parsed = memberProfileSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_profiles")
    .update({
      full_name: parsed.data.fullName,
      headline: parsed.data.headline,
      about: parsed.data.about,
      avatar_url: parsed.data.avatarUrl,
      website: parsed.data.website,
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

export async function addExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể quản lý kinh nghiệm")
  }

  const parsed = memberExperienceSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const startDate = normalizeRequiredDate(parsed.data.startDate)
  const endDate = parsed.data.isCurrent
    ? null
    : normalizeDate(parsed.data.endDate ?? null)

  const { error } = await supabase.from("member_experiences").insert({
    user_id: current.appUser.id,
    company_name: parsed.data.companyName,
    position: parsed.data.position,
    start_date: startDate,
    end_date: endDate,
    is_current: parsed.data.isCurrent,
    description: parsed.data.description,
  })

  if (error) return fail(error.message)

  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function updateExperienceAction(
  input: MemberExperienceInput,
): Promise<ActionResult> {
  if (!input.id) return fail("Thiếu ID kinh nghiệm cần cập nhật")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể quản lý kinh nghiệm")
  }

  const parsed = memberExperienceSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const startDate = normalizeRequiredDate(parsed.data.startDate)
  const endDate = parsed.data.isCurrent
    ? null
    : normalizeDate(parsed.data.endDate ?? null)

  const { error } = await supabase
    .from("member_experiences")
    .update({
      company_name: parsed.data.companyName,
      position: parsed.data.position,
      start_date: startDate,
      end_date: endDate,
      is_current: parsed.data.isCurrent,
      description: parsed.data.description,
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
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể quản lý học vấn")
  }

  const parsed = memberEducationSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const { error } = await supabase.from("member_educations").insert({
    user_id: current.appUser.id,
    school_name: parsed.data.schoolName,
    degree: parsed.data.degree,
    field_of_study: parsed.data.fieldOfStudy,
    start_date: normalizeDate(parsed.data.startDate ?? null),
    end_date: normalizeDate(parsed.data.endDate ?? null),
    description: parsed.data.description,
  })

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

export async function updateEducationAction(
  input: MemberEducationInput,
): Promise<ActionResult> {
  if (!input.id) return fail("Thiếu ID học vấn cần cập nhật")
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể quản lý học vấn")
  }

  const parsed = memberEducationSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_educations")
    .update({
      school_name: parsed.data.schoolName,
      degree: parsed.data.degree,
      field_of_study: parsed.data.fieldOfStudy,
      start_date: normalizeDate(parsed.data.startDate ?? null),
      end_date: normalizeDate(parsed.data.endDate ?? null),
      description: parsed.data.description,
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
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Chỉ thành viên mới có thể quản lý kỹ năng")
  }

  const parsed = skillNameSchema.safeParse(skillName)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Tên kỹ năng không hợp lệ")
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

  const { error } = await supabase
    .from("member_skills")
    .upsert(
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
  const current = await requireCurrentUser()
  if (current.appUser.role !== "company") {
    return fail("Chỉ tài khoản công ty mới có thể cập nhật hồ sơ này")
  }

  const parsed = companyProfileSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("company_profiles")
    .update({
      name: parsed.data.name,
      about: parsed.data.about,
      logo_url: parsed.data.logoUrl,
      website: parsed.data.website,
      industry: parsed.data.industry,
      size: parsed.data.size,
      province_id: parsed.data.provinceId ?? null,
      district_id: parsed.data.districtId ?? null,
      open_to_hire: parsed.data.openToHire,
      business_address: parsed.data.businessAddress,
      business_email: parsed.data.businessEmail,
      representative_name: parsed.data.representativeName,
      representative_title: parsed.data.representativeTitle,
      tax_id: parsed.data.taxId,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateProfile(current.appUser.id)
  return ok(undefined)
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value || value.length === 0) return null
  // YYYY-MM → YYYY-MM-01 cho khớp kiểu DATE của Postgres
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`
  return value
}

function normalizeRequiredDate(value: string): string {
  const normalized = normalizeDate(value)
  if (!normalized) throw new Error("Vui lòng nhập ngày bắt đầu")
  return normalized
}

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}
