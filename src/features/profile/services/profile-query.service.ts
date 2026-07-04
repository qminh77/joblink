import "server-only"

import { mapMemberCv } from "@/features/cvs/types"
import type { createClient } from "@/lib/supabase/server"
import type {
  CompanyProfileRow,
  MemberEducationRow,
  MemberExperienceRow,
  MemberProfileRow,
  ProvinceRow,
  SkillRow,
} from "@/types/database"

import {
  countFollowers,
  countViewerFollow,
  fetchProfileDetailRpc,
  fetchProfileEditOverviewRpc,
  selectActiveProvinces,
  selectActiveWardsByProvince,
  selectCompanyProfileWithLocation,
  selectMemberEducations,
  selectMemberExperiences,
  selectMemberProfileWithLocation,
  selectMemberSkills,
  type CurrentProfileUser,
  type ProfileDetailRpc,
  type ProfileEditOverviewRpc,
  type WardLookupRow,
} from "../data/profile-read.repo"
import type {
  CompanyProfileDetail,
  MemberProfileDetail,
  ProfileEditOverview,
  ProfilePageData,
} from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

export function getActiveProvinces(
  supabase: Supabase,
): Promise<ProvinceRow[]> {
  return selectActiveProvinces(supabase)
}

export function getActiveWardsByProvince(
  supabase: Supabase,
  provinceId: number,
): Promise<WardLookupRow[]> {
  if (!Number.isInteger(provinceId) || provinceId <= 0) {
    return Promise.resolve([])
  }
  return selectActiveWardsByProvince(supabase, provinceId)
}

export async function getProfilePageData(
  supabase: Supabase,
  targetUserId: number,
): Promise<ProfilePageData | null> {
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) return null

  const { data, error } = await fetchProfileDetailRpc(supabase, targetUserId)
  if (error) {
    console.error("[getProfilePageData] RPC error", error)
    return null
  }
  if (!data) return null

  return mapProfileDetail(data as unknown as ProfileDetailRpc)
}

export function getOwnMemberProfile(
  supabase: Supabase,
  current: CurrentProfileUser,
): Promise<MemberProfileDetail | null> {
  if (current.role !== "member") return Promise.resolve(null)
  return loadMemberProfileDetail(supabase, current, current.id)
}

export async function getProfileEditOverview(
  supabase: Supabase,
  current: CurrentProfileUser,
): Promise<ProfileEditOverview | null> {
  if (current.role !== "member") return null

  const { data, error } = await fetchProfileEditOverviewRpc(supabase)
  if (error) {
    console.error("[getProfileEditOverview] RPC error", error)
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
    profileViewCount: current.profile_view_count,
    connectionCount: current.connection_count,
    followerCount: 0,
    isFollowing: false,
    isOwner: true,
    isVisible: true,
  }

  return {
    profile: detail,
    provinces: r.provinces ?? [],
    cvs: (r.cvs ?? []).map(mapMemberCv),
  }
}

export function getOwnCompanyProfile(
  supabase: Supabase,
  current: CurrentProfileUser,
): Promise<CompanyProfileDetail | null> {
  if (current.role !== "company") return Promise.resolve(null)
  return loadCompanyProfileDetail(supabase, current, current.id)
}

function mapProfileDetail(r: ProfileDetailRpc): ProfilePageData {
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
    followerCount: r.followerCount ?? 0,
    isFollowing: r.isFollowing ?? false,
    isOwner: r.isOwner,
    isVisible: r.isVisible ?? true,
  }

  return {
    detail: { kind: "member", data: detail },
    relation: r.relation,
    isOwner: r.isOwner,
  }
}

async function loadMemberProfileDetail(
  supabase: Supabase,
  target: CurrentProfileUser,
  viewerUserId: number,
): Promise<MemberProfileDetail | null> {
  const isOwner = viewerUserId === target.id

  const viewerFollowPromise = isOwner
    ? Promise.resolve({ count: 0 })
    : countViewerFollow(supabase, viewerUserId, "user", target.id)

  const [
    { data: profileRow },
    { data: expData },
    { data: eduData },
    { data: skillData },
    { count: followerCount },
    viewerFollow,
  ] = await Promise.all([
    selectMemberProfileWithLocation(supabase, target.id),
    selectMemberExperiences(supabase, target.id),
    selectMemberEducations(supabase, target.id),
    selectMemberSkills(supabase, target.id),
    countFollowers(supabase, "user", target.id),
    viewerFollowPromise,
  ])

  if (!profileRow) return null

  const { province, ward, ...profile } = profileRow
  const isVisible = profile.profile_visibility !== "private" || isOwner

  const experiences = isVisible ? ((expData ?? []) as MemberExperienceRow[]) : []
  const educations = isVisible ? ((eduData ?? []) as MemberEducationRow[]) : []
  const skills = isVisible ? ((skillData ?? []) as SkillRow[]) : []

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
    followerCount: followerCount ?? 0,
    isFollowing: (viewerFollow.count ?? 0) > 0,
    isOwner,
    isVisible,
  }
}

async function loadCompanyProfileDetail(
  supabase: Supabase,
  target: CurrentProfileUser,
  viewerUserId: number,
): Promise<CompanyProfileDetail | null> {
  const { data } = await selectCompanyProfileWithLocation(supabase, target.id)
  if (!data) return null

  const isOwner = viewerUserId === target.id
  const viewerFollowPromise = isOwner
    ? Promise.resolve({ count: 0 })
    : countViewerFollow(supabase, viewerUserId, "company", target.id)

  const [{ count: followerCount }, viewerFollow] = await Promise.all([
    countFollowers(supabase, "company", target.id),
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
    isFollowing: (viewerFollow.count ?? 0) > 0,
  }
}
