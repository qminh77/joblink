import "server-only"

import type { MemberCvRow } from "@/features/cvs/types"
import type { ConnectionRelation } from "@/features/network/types"
import type { createClient } from "@/lib/supabase/server"
import type {
  AppUserRow,
  CompanyProfileRow,
  MemberEducationRow,
  MemberExperienceRow,
  MemberProfileRow,
  ProvinceRow,
  SkillRow,
} from "@/types/database"

type Supabase = Awaited<ReturnType<typeof createClient>>

type LocationRef = { id: number; name: string } | null

export type MemberProfileWithLocation = MemberProfileRow & {
  province: LocationRef
  ward: LocationRef
}

export type CompanyProfileWithLocation = CompanyProfileRow & {
  province: LocationRef
  ward: LocationRef
}

export type ProfileDetailRpc = {
  kind: "member" | "company"
  isOwner: boolean
  relation: ConnectionRelation
  profile: Record<string, unknown>
  email: string
  province: LocationRef
  ward: LocationRef
  profileViewCount: number
  connectionCount: number
  isVisible?: boolean
  experiences?: MemberExperienceRow[]
  educations?: MemberEducationRow[]
  skills?: SkillRow[]
  followerCount?: number
  isFollowing?: boolean
}

export type ProfileEditOverviewRpc = {
  userId: number
  email: string
  profile: MemberProfileRow
  province: LocationRef
  ward: LocationRef
  experiences: MemberExperienceRow[]
  educations: MemberEducationRow[]
  skills: SkillRow[]
  cvs: MemberCvRow[]
  provinces: ProvinceRow[]
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

export function fetchProfileDetailRpc(
  supabase: Supabase,
  targetUserId: number,
) {
  return supabase.rpc("get_profile_detail", {
    p_target_user_id: targetUserId,
  })
}

export function fetchProfileEditOverviewRpc(supabase: Supabase) {
  return supabase.rpc("get_profile_edit_overview")
}

export function selectMemberProfileWithLocation(
  supabase: Supabase,
  userId: number,
) {
  return supabase
    .from("member_profiles")
    .select(MEMBER_PROFILE_SELECT)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<MemberProfileWithLocation>()
}

export function selectMemberExperiences(supabase: Supabase, userId: number) {
  return supabase
    .from("member_experiences")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("is_current", { ascending: false })
    .order("start_date", { ascending: false })
}

export function selectMemberEducations(supabase: Supabase, userId: number) {
  return supabase
    .from("member_educations")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
}

export function selectMemberSkills(supabase: Supabase, userId: number) {
  return supabase
    .from("member_skills")
    .select("id, name")
    .eq("user_id", userId)
    .order("name", { ascending: true })
}

export function selectCompanyProfileWithLocation(
  supabase: Supabase,
  userId: number,
) {
  return supabase
    .from("company_profiles")
    .select(COMPANY_PROFILE_SELECT)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<CompanyProfileWithLocation>()
}

export function countFollowers(
  supabase: Supabase,
  followableType: "user" | "company",
  followableId: number,
) {
  return supabase
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("followable_type", followableType)
    .eq("followable_id", followableId)
}

export function countViewerFollow(
  supabase: Supabase,
  viewerUserId: number,
  followableType: "user" | "company",
  followableId: number,
) {
  return supabase
    .from("follows")
    .select("id", { head: true, count: "exact" })
    .eq("follower_id", viewerUserId)
    .eq("followable_type", followableType)
    .eq("followable_id", followableId)
}

export type CurrentProfileUser = Pick<
  AppUserRow,
  | "id"
  | "email"
  | "role"
  | "profile_view_count"
  | "connection_count"
>
