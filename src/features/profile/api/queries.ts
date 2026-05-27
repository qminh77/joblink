import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import type {
  AppUserRow,
  CompanyProfileRow,
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

type LocationRef = { id: number; name: string } | null

type MemberProfileWithLocation = MemberProfileRow & {
  province: LocationRef
  district: LocationRef
}

type CompanyProfileWithLocation = CompanyProfileRow & {
  province: LocationRef
  district: LocationRef
}

const MEMBER_PROFILE_SELECT = `
  *,
  province:provinces(id, name),
  district:districts(id, name)
`

const COMPANY_PROFILE_SELECT = `
  *,
  province:provinces(id, name),
  district:districts(id, name)
`

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
    const company = await loadCompanyProfileDetail(
      supabase,
      target,
      current.appUser.id,
    )
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
  return loadCompanyProfileDetail(supabase, current.appUser, current.appUser.id)
}

async function loadMemberProfileDetail(
  supabase: SupabaseServer,
  target: AppUserRow,
  viewerUserId: number,
): Promise<MemberProfileDetail | null> {
  const isOwner = viewerUserId === target.id

  const profilePromise = supabase
    .from("member_profiles")
    .select(MEMBER_PROFILE_SELECT)
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .maybeSingle<MemberProfileWithLocation>()

  const experiencesPromise = supabase
    .from("member_experiences")
    .select("*")
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .order("is_current", { ascending: false })
    .order("start_date", { ascending: false })

  const educationsPromise = supabase
    .from("member_educations")
    .select("*")
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })

  const skillsPromise = supabase
    .from("member_skills")
    .select("skill_id, skills(id, name)")
    .eq("user_id", target.id)

  const [
    { data: profileRow },
    { data: expData },
    { data: eduData },
    { data: skillData },
  ] = await Promise.all([
    profilePromise,
    experiencesPromise,
    educationsPromise,
    skillsPromise,
  ])

  if (!profileRow) return null

  const { province, district, ...profile } = profileRow
  const isVisible = profile.profile_visibility !== "private" || isOwner

  const experiences = isVisible ? ((expData ?? []) as MemberExperienceRow[]) : []
  const educations = isVisible ? ((eduData ?? []) as MemberEducationRow[]) : []
  const skills = isVisible
    ? ((skillData ?? []) as unknown as Array<{ skills: SkillRow | null }>)
        .map((row) => row.skills)
        .filter((row): row is SkillRow => row != null)
    : []

  return {
    ...profile,
    email: target.email,
    province,
    district,
    experiences,
    educations,
    skills,
    profileViewCount: target.profile_view_count,
    connectionCount: target.connection_count,
    isOwner,
    isVisible,
  }
}

async function loadCompanyProfileDetail(
  supabase: SupabaseServer,
  target: AppUserRow,
  viewerUserId: number,
): Promise<CompanyProfileDetail | null> {
  const { data } = await supabase
    .from("company_profiles")
    .select(COMPANY_PROFILE_SELECT)
    .eq("user_id", target.id)
    .is("deleted_at", null)
    .maybeSingle<CompanyProfileWithLocation>()

  if (!data) return null

  const isOwner = viewerUserId === target.id

  const followerPromise = supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("followable_type", "company")
    .eq("followable_id", target.id)

  const viewerFollowPromise = isOwner
    ? null
    : supabase
        .from("follows")
        .select("id", { head: true, count: "exact" })
        .eq("follower_id", viewerUserId)
        .eq("followable_type", "company")
        .eq("followable_id", target.id)

  const [{ count: followerCount }, viewerFollow] = await Promise.all([
    followerPromise,
    viewerFollowPromise,
  ])

  const { province, district, ...rest } = data

  return {
    ...rest,
    email: target.email,
    province,
    district,
    profileViewCount: target.profile_view_count,
    connectionCount: target.connection_count,
    followerCount: followerCount ?? 0,
    isFollowing: (viewerFollow?.count ?? 0) > 0,
  }
}
