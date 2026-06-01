import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import type { ConnectionRelation } from "@/features/network/types"
import { mapMemberCv, type MemberCv, type MemberCvRow } from "@/features/cvs/types"
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
  CompanyProfileDetail,
  MemberProfileDetail,
  ProfilePageData,
} from "../types"

export type ProfileEditOverview = {
  profile: MemberProfileDetail
  provinces: ProvinceRow[]
  cvs: MemberCv[]
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

type LocationRef = { id: number; name: string } | null

type MemberProfileWithLocation = MemberProfileRow & {
  province: LocationRef
  ward: LocationRef
}

type CompanyProfileWithLocation = CompanyProfileRow & {
  province: LocationRef
  ward: LocationRef
}

const MEMBER_PROFILE_SELECT = `
  *,
  province:provinces(id, name),
  ward:wards(id, name)
`

const COMPANY_PROFILE_SELECT = `
  *,
  province:provinces(id, name),
  ward:wards(id, name)
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

export async function loadWardsByProvince(provinceId: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("wards")
    .select("id, province_id, code, name, name_en, sort_order, is_active")
    .eq("province_id", provinceId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  return data ?? []
}

type ProfileDetailRpc = {
  kind: "member" | "company"
  isOwner: boolean
  relation: ConnectionRelation
  profile: Record<string, unknown>
  email: string
  province: { id: number; name: string } | null
  ward: { id: number; name: string } | null
  profileViewCount: number
  connectionCount: number
  isVisible?: boolean
  experiences?: MemberExperienceRow[]
  educations?: MemberEducationRow[]
  skills?: SkillRow[]
  followerCount?: number
  isFollowing?: boolean
}

/**
 * Tải toàn bộ dữ liệu trang hồ sơ (/profile/[id]) trong MỘT round-trip qua RPC
 * `get_profile_detail` — thay cho waterfall users + profile + exp/edu/skills +
 * follower + connection trước đây. Trả kèm `relation` để trang không phải gọi
 * `loadConnectionRelation` riêng.
 */
export async function loadProfileById(
  targetUserId: number,
): Promise<ProfilePageData | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_profile_detail", {
    p_target_user_id: targetUserId,
  })

  if (error) {
    console.error("[loadProfileById] RPC error", error)
    return null
  }
  if (!data) return null

  const r = data as unknown as ProfileDetailRpc

  if (r.kind === "company") {
    const detail: CompanyProfileDetail = {
      ...(r.profile as unknown as CompanyProfileRow),
      email: r.email,
      province: r.province,
      ward: r.ward,
      profileViewCount: r.profileViewCount,
      connectionCount: r.connectionCount,
      followerCount: r.followerCount ?? 0,
      isFollowing: r.isFollowing ?? false,
    }
    return {
      detail: { kind: "company", data: detail },
      relation: r.relation,
      isOwner: r.isOwner,
    }
  }

  const detail: MemberProfileDetail = {
    ...(r.profile as unknown as MemberProfileRow),
    email: r.email,
    province: r.province,
    ward: r.ward,
    experiences: r.experiences ?? [],
    educations: r.educations ?? [],
    skills: r.skills ?? [],
    profileViewCount: r.profileViewCount,
    connectionCount: r.connectionCount,
    isOwner: r.isOwner,
    isVisible: r.isVisible ?? true,
  }
  return {
    detail: { kind: "member", data: detail },
    relation: r.relation,
    isOwner: r.isOwner,
  }
}

export async function loadOwnMemberProfile(): Promise<MemberProfileDetail | null> {
  const current = await getCurrentUser()
  if (!current || current.appUser.role !== "member") return null
  const supabase = await createClient()
  return loadMemberProfileDetail(supabase, current.appUser, current.appUser.id)
}

type ProfileEditOverviewRpc = {
  userId: number
  email: string
  profile: MemberProfileRow
  province: { id: number; name: string } | null
  ward: { id: number; name: string } | null
  experiences: MemberExperienceRow[]
  educations: MemberEducationRow[]
  skills: SkillRow[]
  cvs: MemberCvRow[]
  provinces: ProvinceRow[]
}

// Gộp toàn bộ dữ liệu trang /profile/edit về 1 round-trip qua RPC
// `get_profile_edit_overview`. Trang dùng hàm này thay cho
// Promise.all([loadOwnMemberProfile, loadProvinces, loadOwnCvs]).
export async function loadProfileEditOverview(): Promise<ProfileEditOverview | null> {
  const current = await getCurrentUser()
  if (!current || current.appUser.role !== "member") return null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_profile_edit_overview")
  if (error) {
    console.error("[loadProfileEditOverview] rpc", error)
    return null
  }
  if (!data) return null
  const r = data as unknown as ProfileEditOverviewRpc

  const detail: MemberProfileDetail = {
    ...(r.profile as MemberProfileRow),
    email: r.email,
    province: r.province,
    ward: r.ward,
    experiences: r.experiences ?? [],
    educations: r.educations ?? [],
    skills: r.skills ?? [],
    profileViewCount: current.appUser.profile_view_count,
    connectionCount: current.appUser.connection_count,
    isOwner: true,
    isVisible: true,
  }
  return {
    profile: detail,
    provinces: r.provinces ?? [],
    cvs: (r.cvs ?? []).map(mapMemberCv),
  }
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

  const { province, ward, ...profile } = profileRow
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
    ward,
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

  const { province, ward, ...rest } = data

  return {
    ...rest,
    email: target.email,
    province,
    ward,
    profileViewCount: target.profile_view_count,
    connectionCount: target.connection_count,
    followerCount: followerCount ?? 0,
    isFollowing: (viewerFollow?.count ?? 0) > 0,
  }
}
