import type { ConnectionRelation } from "@/features/network/types"
import type { MemberCv } from "@/features/cvs/types"
import type {
  CompanyProfileRow,
  MemberEducationRow,
  MemberExperienceRow,
  MemberProfileRow,
  ProfileVisibility,
  ProvinceRow,
  SkillRow,
} from "@/types/database"

export type MemberProfileDetail = MemberProfileRow & {
  email: string
  province: Pick<ProvinceRow, "id" | "name"> | null
  ward: { id: number; name: string } | null
  experiences: MemberExperienceRow[]
  educations: MemberEducationRow[]
  skills: SkillRow[]
  profileViewCount: number
  connectionCount: number
  followerCount: number
  isFollowing: boolean
  isOwner: boolean
  isVisible: boolean
}

export type CompanyProfileDetail = CompanyProfileRow & {
  email: string
  province: Pick<ProvinceRow, "id" | "name"> | null
  ward: { id: number; name: string } | null
  profileViewCount: number
  connectionCount: number
  followerCount: number
  isFollowing: boolean
}

export type AnyProfileDetail =
  | { kind: "member"; data: MemberProfileDetail }
  | { kind: "company"; data: CompanyProfileDetail }

export type ProfilePageData = {
  detail: AnyProfileDetail
  relation: ConnectionRelation
  isOwner: boolean
}

export type ProfileEditOverview = {
  profile: MemberProfileDetail
  provinces: ProvinceRow[]
  cvs: MemberCv[]
}

export type ProfileVisibilityValue = ProfileVisibility
