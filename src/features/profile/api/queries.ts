import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type {
  AppUserRow,
  MemberEducationRow,
  MemberExperienceRow,
  MemberProfileRow,
  ProvinceRow,
  SkillRow,
} from "@/types/database"

import type {
  AnyProfileDetail,
  CompanyProfileDetail,
  MemberProfileDetail,
} from "../types"

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

export async function loadProvinces(): Promise<ProvinceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("provinces")
    .select("id, code, name, name_en, sort_order, is_active")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return (data ?? []) as ProvinceRow[]
}

export async function loadDistrictsByProvince(provinceId: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("districts")
    .select("id, province_id, code, name, name_en, sort_order, is_active")
    .eq("province_id", provinceId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return data ?? []
}

export async function loadProfileById(
  targetUserId: number,
): Promise<AnyProfileDetail | null> {
  const supabase = await createClient()
  const current = await getCurrentUser()
  if (!current) return null

  const { data: target } = await supabase
    .from("users")
    .select("*")
    .eq("id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle<AppUserRow>()

  if (!target) return null

  if (target.role === "company") {
    const company = await loadCompanyProfileDetail(supabase, target)
    if (!company) return null
    return { kind: "company", data: company }
  }

  const member = await loadMemberProfileDetail(
    supabase,
    target,
    current.appUser.id,
  )
  if (!member) return null
  return { kind: "member", data: member }
}

export async function loadOwnMemberProfile(): Promise<MemberProfileDetail | null> {
  const current = await getCurrentUser()
  if (!current || current.appUser.role !== "member") return null
  const supabase = await createClient()
  return loadMemberProfileDetail(supabase, current.appUser, current.appUser.id)
}

export async function loadOwnCompanyProfile(): Promise<CompanyProfileDetail | null> {
  const current = await getCurrentUser()
  if (!current || current.appUser.role !== "company") return null
  const supabase = await createClient()
  return loadCompanyProfileDetail(supabase, current.appUser)
}

async function loadMemberProfileDetail(
  supabase: SupabaseServer,
  target: AppUserRow,
  viewerUserId: number,
): Promise<MemberProfileDetail | null> {
  const { data: profile } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .maybeSingle<MemberProfileRow>()

  if (!profile) return null

  const isOwner = viewerUserId === target.id
  const isVisible = profile.profile_visibility !== "private" || isOwner

  const province = profile.province_id
    ? await loadProvinceById(supabase, profile.province_id)
    : null
  const district = profile.district_id
    ? await loadDistrictById(supabase, profile.district_id)
    : null

  let experiences: MemberExperienceRow[] = []
  let educations: MemberEducationRow[] = []
  let skills: SkillRow[] = []

  if (isVisible) {
    const [{ data: exp }, { data: edu }, { data: ms }] = await Promise.all([
      supabase
        .from("member_experiences")
        .select("*")
        .eq("user_id", target.id)
        .is("deleted_at", null)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false }),
      supabase
        .from("member_educations")
        .select("*")
        .eq("user_id", target.id)
        .is("deleted_at", null)
        .order("start_date", { ascending: false }),
      supabase
        .from("member_skills")
        .select("skill_id, skills(id, name)")
        .eq("user_id", target.id),
    ])

    experiences = (exp ?? []) as MemberExperienceRow[]
    educations = (edu ?? []) as MemberEducationRow[]
    skills =
      ((ms ?? []) as Array<{ skills: SkillRow | null }>)
        .map((row) => row.skills)
        .filter((row): row is SkillRow => row != null)
  }

  const { count: profileViewCount } = await supabase
    .from("profile_view_logs")
    .select("id", { count: "exact", head: true })
    .eq("target_user_id", target.id)

  return {
    ...profile,
    email: target.email,
    province,
    district,
    experiences,
    educations,
    skills,
    profileViewCount: profileViewCount ?? 0,
    isOwner,
    isVisible,
  }
}

async function loadCompanyProfileDetail(
  supabase: SupabaseServer,
  target: AppUserRow,
): Promise<CompanyProfileDetail | null> {
  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .maybeSingle<CompanyProfileDetail>()

  if (!data) return null

  const province = data.province_id
    ? await loadProvinceById(supabase, data.province_id)
    : null
  const district = data.district_id
    ? await loadDistrictById(supabase, data.district_id)
    : null

  return {
    ...data,
    email: target.email,
    province,
    district,
  }
}

async function loadProvinceById(supabase: SupabaseServer, id: number) {
  const { data } = await supabase
    .from("provinces")
    .select("id, name")
    .eq("id", id)
    .maybeSingle<{ id: number; name: string }>()
  return data ?? null
}

async function loadDistrictById(supabase: SupabaseServer, id: number) {
  const { data } = await supabase
    .from("districts")
    .select("id, name")
    .eq("id", id)
    .maybeSingle<{ id: number; name: string }>()
  return data ?? null
}
