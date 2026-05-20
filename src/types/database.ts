import type { UserRole, UserStatus } from "@/lib/constants"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProfileVisibility = "public" | "connections" | "private"
export type CompanyVerification =
  | "pending"
  | "pending_update"
  | "verified"
  | "rejected"
  | "suspended"

export type AppUserRow = {
  id: number
  auth_id: string
  email: string
  role: UserRole
  status: UserStatus
  email_verified_at: string | null
  phone: string | null
  phone_verified_at: string | null
  two_fa_enabled: boolean
  locale: string
  last_login_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProvinceRow = {
  id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
}

export type DistrictRow = {
  id: number
  province_id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
}

export type MemberProfileRow = {
  id: number
  user_id: number
  full_name: string
  avatar_url: string | null
  headline: string | null
  about: string | null
  province_id: number | null
  district_id: number | null
  website: string | null
  open_to_work: boolean
  profile_visibility: ProfileVisibility
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MemberExperienceRow = {
  id: number
  user_id: number
  company_name: string
  position: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MemberEducationRow = {
  id: number
  user_id: number
  school_name: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type SkillRow = {
  id: number
  name: string
}

export type MemberSkillRow = {
  user_id: number
  skill_id: number
  endorsement_count: number
}

export type ProfileViewLogRow = {
  id: number
  target_user_id: number
  viewer_user_id: number | null
  viewed_at: string
}

export type CompanyProfileRow = {
  id: number
  user_id: number
  name: string
  slug: string
  logo_url: string | null
  about: string | null
  website: string | null
  province_id: number | null
  district_id: number | null
  industry: string | null
  size: string | null
  open_to_hire: boolean
  tax_id: string | null
  representative_name: string | null
  representative_title: string | null
  business_address: string | null
  business_email: string | null
  verification_status: CompanyVerification
  verification_note: string | null
  verified_at: string | null
  verified_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type TableDef<TRow, TInsert = Partial<TRow>, TUpdate = Partial<TRow>> = {
  Row: TRow
  Insert: TInsert
  Update: TUpdate
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      users: TableDef<AppUserRow>
      provinces: TableDef<ProvinceRow>
      districts: TableDef<DistrictRow>
      member_profiles: TableDef<MemberProfileRow>
      member_experiences: TableDef<
        MemberExperienceRow,
        Omit<
          MemberExperienceRow,
          "id" | "created_at" | "updated_at" | "deleted_at"
        >
      >
      member_educations: TableDef<
        MemberEducationRow,
        Omit<
          MemberEducationRow,
          "id" | "created_at" | "updated_at" | "deleted_at"
        >
      >
      skills: TableDef<SkillRow, { name: string }>
      member_skills: TableDef<MemberSkillRow, MemberSkillRow>
      profile_view_logs: TableDef<
        ProfileViewLogRow,
        Omit<ProfileViewLogRow, "id" | "viewed_at">
      >
      company_profiles: TableDef<CompanyProfileRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
