import type { ConnectionStatus, UserRole, UserStatus } from "@/lib/constants"

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
  connection_count: number
  profile_view_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PostType = "text" | "image" | "video" | "article" | "poll"
export type PostVisibility = "public" | "connections" | "private"
export type PostStatus = "active" | "hidden" | "deleted"

export type PostRow = {
  id: number
  author_id: number
  content: string
  post_type: PostType
  media: Json | null
  visibility: PostVisibility
  status: PostStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PostReactionType =
  | "like"
  | "celebrate"
  | "support"
  | "love"
  | "insightful"
  | "funny"

export type PostReactionRow = {
  id: number
  post_id: number
  user_id: number
  reaction_type: PostReactionType
  created_at: string
}

export type PostCommentRow = {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  status: "active" | "hidden" | "deleted"
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

export type ConnectionRow = {
  id: number
  requester_id: number
  receiver_id: number
  status: ConnectionStatus
  requested_at: string
  responded_at: string | null
}

export type NotificationType =
  | "connection_request"
  | "connection_accepted"

export type NotificationRow = {
  id: number
  user_id: number
  type: NotificationType
  title: string | null
  payload: Json | null
  read_at: string | null
  created_at: string
}

export type NotificationPreferenceRow = {
  id: number
  user_id: number
  type: NotificationType
  in_app_enabled: boolean
  email_enabled: boolean
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
      connections: TableDef<
        ConnectionRow,
        Omit<ConnectionRow, "id" | "requested_at" | "responded_at">
      >
      notifications: TableDef<
        NotificationRow,
        Omit<NotificationRow, "id" | "created_at" | "read_at" | "title"> & {
          title?: string | null
          read_at?: string | null
        }
      >
      notification_preferences: TableDef<
        NotificationPreferenceRow,
        Omit<NotificationPreferenceRow, "id">
      >
      posts: TableDef<
        PostRow,
        Omit<
          PostRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "deleted_at"
          | "status"
          | "media"
          | "visibility"
          | "post_type"
        > & {
          status?: PostStatus
          visibility?: PostVisibility
          post_type?: PostType
          media?: Json | null
        },
        Partial<PostRow> & { deleted_at?: string | null }
      >
      post_reactions: TableDef<
        PostReactionRow,
        Omit<PostReactionRow, "id" | "created_at">
      >
      post_comments: TableDef<
        PostCommentRow,
        Omit<PostCommentRow, "id" | "created_at" | "updated_at" | "deleted_at" | "status"> & {
          status?: PostCommentRow["status"]
        }
      >
    }
    Views: Record<string, never>
    Functions: {
      get_home_feed: {
        Args: {
          p_posts_cursor?: string | null
          p_posts_limit?: number
          p_suggestion_limit?: number
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
