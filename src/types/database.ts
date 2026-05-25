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

export type PostShareRow = {
  id: number
  post_id: number
  user_id: number
  comment_content: string | null
  created_at: string
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

export type ReportTargetType = "user" | "post" | "comment" | "job" | "company"
export type ReportStatus = "pending" | "in_review" | "resolved" | "dismissed"

export type ReportTypeRow = {
  id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ReportRow = {
  id: number
  reporter_id: number
  target_type: ReportTargetType
  target_id: number
  reason: string
  description: string | null
  status: ReportStatus
  assigned_to: number | null
  resolved_by: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "post_reaction"
  | "post_comment"
  | "post_share"
  | "comment_mention"
  | "new_message"

export type ConversationRow = {
  id: number
  type: "direct"
  created_at: string
  updated_at: string
}

export type ConversationParticipantRow = {
  conversation_id: number
  user_id: number
  joined_at: string
  last_read_at: string | null
}

export type MessageRow = {
  id: number
  conversation_id: number
  sender_id: number
  content: string | null
  media: Json | null
  read_at: string | null
  created_at: string
  deleted_at: string | null
}

export type UserBlockRow = {
  id: number
  blocker_id: number
  blocked_id: number
  reason: string | null
  created_at: string
}

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
        },
        Partial<PostCommentRow> & { deleted_at?: string | null }
      >
      post_shares: TableDef<
        PostShareRow,
        Omit<PostShareRow, "id" | "created_at"> & {
          comment_content?: string | null
        }
      >
      report_types: TableDef<
        ReportTypeRow,
        Omit<ReportTypeRow, "id" | "created_at" | "updated_at">
      >
      reports: TableDef<
        ReportRow,
        Omit<ReportRow, "id" | "created_at" | "updated_at" | "status" | "assigned_to" | "resolved_by" | "resolved_at"> & {
          status?: ReportStatus
          assigned_to?: number | null
          resolved_by?: number | null
          resolved_at?: string | null
        }
      >
      conversations: TableDef<
        ConversationRow,
        Omit<ConversationRow, "id" | "created_at" | "updated_at" | "type"> & {
          type?: "direct"
        }
      >
      conversation_participants: TableDef<
        ConversationParticipantRow,
        Omit<ConversationParticipantRow, "joined_at" | "last_read_at"> & {
          last_read_at?: string | null
        }
      >
      messages: TableDef<
        MessageRow,
        Omit<MessageRow, "id" | "created_at" | "deleted_at" | "read_at" | "media" | "content"> & {
          content?: string | null
          media?: Json | null
          read_at?: string | null
        }
      >
      user_blocks: TableDef<
        UserBlockRow,
        Omit<UserBlockRow, "id" | "created_at" | "reason"> & {
          reason?: string | null
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
      get_network_overview: {
        Args: {
          p_suggestion_limit?: number
        }
        Returns: Json
      }
      get_user_posts: {
        Args: {
          p_target_user_id: number
          p_posts_cursor?: string | null
          p_posts_limit?: number
        }
        Returns: Json
      }
      get_messaging_overview: {
        Args: { p_limit?: number }
        Returns: Json
      }
      get_unread_conversations_count: {
        Args: Record<string, never>
        Returns: number
      }
      get_conversation_messages: {
        Args: {
          p_conversation_id: number
          p_before_created_at?: string | null
          p_before_id?: number | null
          p_limit?: number
        }
        Returns: Json
      }
      find_or_create_direct_conversation: {
        Args: { p_other_user_id: number }
        Returns: Json
      }
      send_message: {
        Args: { p_conversation_id: number; p_content: string }
        Returns: Json
      }
      mark_conversation_read: {
        Args: { p_conversation_id: number }
        Returns: Json
      }
    }

    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
