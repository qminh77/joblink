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
  two_fa_secret: string | null
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
  reaction_count: number | null
  comment_count: number | null
  share_count: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PollOptionRow = {
  id: number
  post_id: number
  option_text: string
  vote_count: number
}

export type PollVoteRow = {
  id: number
  post_id: number
  option_id: number
  user_id: number
  voted_at: string
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
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type WardRow = {
  id: number
  province_id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MemberProfileRow = {
  id: number
  user_id: number
  full_name: string
  avatar_url: string | null
  cover_url: string | null
  headline: string | null
  about: string | null
  province_id: number | null
  ward_id: number | null
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
  id: number
  user_id: number
  name: string
  endorsement_count: number
}

export type ProfileViewLogRow = {
  id: number
  target_user_id: number
  viewer_user_id: number | null
  viewed_at: string
}

export type MemberCvRow = {
  id: number
  user_id: number
  file_name: string
  storage_path: string
  file_size: number
  mime_type: string
  source: string
  builder_config: Json | null
  is_default: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
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
  | "company_followed"
  | "user_followed"
  | "job_application_received"
  | "application_status_changed"
  | "application_withdrawn"
  | "poll_vote"
  | "interview_scheduled"
  | "interview_response"

export type ConversationRow = {
  id: number
  type: "direct"
  last_message_id: number | null
  last_content: string | null
  last_sender_id: number | null
  last_message_created_at: string | null
  created_at: string
  updated_at: string
}

export type ConversationParticipantRow = {
  conversation_id: number
  user_id: number
  unread_count: number
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
  // Khoá nhóm tùy chỉnh (NotificationCategory, vd "like"/"message"), KHÔNG phải
  // NotificationType — cột VARCHAR(80) gom nhiều loại notification vào 1 nhóm.
  type: string
  in_app_enabled: boolean
  email_enabled: boolean
}

export type JobTypeRow = {
  id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type WorkModeRow = {
  id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type JobPositionRow = {
  id: number
  code: string
  name: string
  name_en: string | null
  sort_order: number
  is_active: boolean
  parent_id: number | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type JobRow = {
  id: number
  company_user_id: number
  title: string
  description: string
  requirements: string | null
  province_id: number | null
  ward_id: number | null
  salary_min: number | null
  salary_max: number | null
  salary_visible: boolean
  job_type_id: number
  work_mode_id: number
  job_position_id: number | null
  position_title: string | null
  status: "draft" | "active" | "closed" | "expired" | "removed"
  expires_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type SavedJobRow = {
  user_id: number
  job_id: number
  created_at: string
}

export type JobAlertRow = {
  id: number
  user_id: number
  name: string | null
  filters: Json
  alert_enabled: boolean
  last_notified_at: string | null
  created_at: string
  updated_at: string
}

export type AuditLogRow = {
  id: number
  actor_id: number | null
  action: string
  entity_type: string | null
  entity_id: number | null
  old_data: Json | null
  new_data: Json | null
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type AdminAuditLogView = AuditLogRow & {
  actor_email: string | null
  actor_name: string | null
}

export type SystemSettingsRow = {
  id: number
  setting_key: string
  setting_group: string
  value: Json | null
  encrypted: boolean
  updated_by: number | null
  created_at: string
  updated_at: string
}

export type ModerationActionType =
  | "hide"
  | "delete"
  | "warn"
  | "suspend"
  | "ban"
  | "restore"
  | "dismiss"

export type ModerationActionRow = {
  id: number
  report_id: number | null
  moderator_id: number
  target_type: ReportTargetType
  target_id: number
  action_type: ModerationActionType
  reason: string
  created_at: string
}

export type AppealStatus = "pending" | "accepted" | "rejected"

export type AppealRow = {
  id: number
  appellant_id: number
  report_id: number | null
  moderation_action_id: number | null
  reason: string
  status: AppealStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
}

export type JobApplicationRow = {
  id: number
  job_id: number
  applicant_id: number
  resume_url: string | null
  cover_letter: string | null
  status:
    | "applied"
    | "reviewed"
    | "interview"
    | "offered"
    | "hired"
    | "rejected"
    | "withdrawn"
  applied_at: string
  updated_at: string
}

export type CompanyProfileRow = {
  id: number
  user_id: number
  name: string
  slug: string
  logo_url: string | null
  cover_url: string | null
  about: string | null
  website: string | null
  phone: string | null
  province_id: number | null
  ward_id: number | null
  industry: string | null
  size: string | null
  open_to_hire: boolean
  tax_id: string | null
  representative_name: string | null
  representative_title: string | null
  business_address: string | null
  business_email: string | null
  verification_documents: Json | null
  verification_status: CompanyVerification
  verification_note: string | null
  verified_at: string | null
  verified_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type FollowRow = {
  id: number
  follower_id: number
  followable_type: string
  followable_id: number
  created_at: string
}

export type JobSkillRow = {
  job_id: number
  skill_id: number
  is_required: boolean
}

export type ApplicationStatusHistoryRow = {
  id: number
  application_id: number
  old_status: string
  new_status: string
  changed_by: number
  note: string | null
  changed_at: string
}

export type InterviewScheduleRow = {
  id: number
  application_id: number
  scheduled_at: string
  duration_minutes: number
  location_or_link: string | null
  note: string | null
  created_by: number
  status: "pending" | "accepted" | "rejected" | "cancelled"
  responded_at: string | null
  created_at: string
  updated_at: string
}

export type JobViewLogRow = {
  id: number
  job_id: number
  viewer_user_id: number | null
  viewed_at: string
}

export type NetworkSuggestionRow = {
  user_id: number
  suggested_user_id: number
  score: number
  created_at: string
}

export type UserFeedRow = {
  user_id: number
  post_id: number
  created_at: string
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
      wards: TableDef<WardRow>
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
      member_skills: TableDef<
        MemberSkillRow,
        { user_id: number; name: string; endorsement_count?: number }
      >
      member_cvs: TableDef<
        MemberCvRow,
        Omit<MemberCvRow, "id" | "created_at" | "updated_at" | "deleted_at"> & {
          is_default?: boolean
          source?: string
          builder_config?: Json | null
        }
      >
      profile_view_logs: TableDef<
        ProfileViewLogRow,
        Omit<ProfileViewLogRow, "id" | "viewed_at">
      >
      company_profiles: TableDef<CompanyProfileRow>
      follows: TableDef<
        FollowRow,
        Omit<FollowRow, "id" | "created_at">
      >
      job_skills: TableDef<JobSkillRow>
      application_status_history: TableDef<
        ApplicationStatusHistoryRow,
        Omit<ApplicationStatusHistoryRow, "id" | "changed_at">
      >
      interview_schedules: TableDef<
        InterviewScheduleRow,
        Omit<InterviewScheduleRow, "id" | "created_at" | "updated_at" | "status" | "responded_at"> & {
          status?: InterviewScheduleRow["status"]
          responded_at?: string | null
        }
      >
      job_view_logs: TableDef<
        JobViewLogRow,
        Omit<JobViewLogRow, "id" | "viewed_at">
      >
      network_suggestions: TableDef<
        NetworkSuggestionRow,
        Omit<NetworkSuggestionRow, "created_at">
      >
      user_feeds: TableDef<
        UserFeedRow,
        Omit<UserFeedRow, "created_at">
      >
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
          | "reaction_count"
          | "comment_count"
          | "share_count"
        > & {
          status?: PostStatus
          visibility?: PostVisibility
          post_type?: PostType
          media?: Json | null
          reaction_count?: number | null
          comment_count?: number | null
          share_count?: number | null
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
      poll_options: TableDef<
        PollOptionRow,
        Omit<PollOptionRow, "id" | "vote_count"> & {
          vote_count?: number
        }
      >
      poll_votes: TableDef<
        PollVoteRow,
        Omit<PollVoteRow, "id" | "voted_at">
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
      job_types: TableDef<JobTypeRow>
      work_modes: TableDef<WorkModeRow>
      job_positions: TableDef<JobPositionRow>
      jobs: TableDef<JobRow>
      saved_jobs: TableDef<SavedJobRow, Omit<SavedJobRow, "created_at">>
      job_alerts: TableDef<
        JobAlertRow,
        Omit<
          JobAlertRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "alert_enabled"
          | "last_notified_at"
        > & { alert_enabled?: boolean; last_notified_at?: string | null }
      >
      job_applications: TableDef<JobApplicationRow>
      audit_logs: TableDef<
        AuditLogRow,
        Omit<AuditLogRow, "id" | "created_at"> & { created_at?: string }
      >
      moderation_actions: TableDef<
        ModerationActionRow,
        Omit<ModerationActionRow, "id" | "created_at">
      >
      system_settings: TableDef<
        SystemSettingsRow,
        Omit<SystemSettingsRow, "id" | "created_at" | "updated_at">
      >
      appeals: TableDef<
        AppealRow,
        Omit<
          AppealRow,
          | "id"
          | "created_at"
          | "status"
          | "reviewed_by"
          | "reviewed_at"
        > & {
          status?: AppealStatus
          reviewed_by?: number | null
          reviewed_at?: string | null
        }
      >
    }
    Views: Record<string, never>
    Functions: {
      create_post: {
        Args: {
          p_content: string
          p_post_type?: PostType
          p_media?: Json | null
          p_visibility?: PostVisibility
        }
        Returns: Json
      }
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
      get_profile_detail: {
        Args: {
          p_target_user_id: number
        }
        Returns: Json
      }
      get_profile_edit_overview: {
        Args: Record<string, never>
        Returns: Json
      }
      set_default_member_cv: {
        Args: { p_cv_id: number }
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
      get_company_public_overview: {
        Args: { p_company_user_id: number; p_jobs_limit?: number }
        Returns: Json
      }
      toggle_follow_company: {
        Args: { p_company_user_id: number }
        Returns: Json
      }
      toggle_follow_user: {
        Args: { p_target_user_id: number }
        Returns: Json
      }
      get_company_dashboard_overview: {
        Args: Record<string, never>
        Returns: Json
      }
      get_company_jobs: {
        Args: {
          p_status?: string
          p_search?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      get_company_applicants: {
        Args: {
          p_job_id?: number | null
          p_status?: string
          p_search?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      update_application_status: {
        Args: {
          p_application_id: number
          p_new_status: string
          p_note?: string | null
        }
        Returns: Json
      }
      update_job_status: {
        Args: { p_job_id: number; p_new_status: string }
        Returns: Json
      }
      create_job: {
        Args: {
          p_title: string
          p_description: string
          p_requirements: string | null
          p_province_id: number | null
          p_ward_id: number | null
          p_salary_min: number | null
          p_salary_max: number | null
          p_salary_visible: boolean
          p_job_type_id: number
          p_work_mode_id: number
          p_job_position_id: number | null
          p_position_title: string | null
          p_status: string
          p_expires_at: string | null
          p_skills: string[] | null
        }
        Returns: Json
      }
      update_job: {
        Args: {
          p_job_id: number
          p_title: string
          p_description: string
          p_requirements: string | null
          p_province_id: number | null
          p_ward_id: number | null
          p_salary_min: number | null
          p_salary_max: number | null
          p_salary_visible: boolean
          p_job_type_id: number
          p_work_mode_id: number
          p_position_title: string | null
          p_expires_at: string | null
          p_skills: string[] | null
        }
        Returns: Json
      }
      get_job_for_edit: {
        Args: { p_job_id: number }
        Returns: Json
      }
      get_jobs_list: {
        Args: {
          p_search?: string | null
          p_province_id?: number | null
          p_job_type_ids?: number[] | null
          p_work_mode_ids?: number[] | null
          p_salary_min?: number | null
          p_company_user_id?: number | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      get_job_detail: {
        Args: { p_job_id: number }
        Returns: Json
      }
      apply_to_job: {
        Args: {
          p_job_id: number
          p_cover_letter: string | null
          p_resume_url: string | null
        }
        Returns: Json
      }
      withdraw_application: {
        Args: { p_application_id: number }
        Returns: Json
      }
      toggle_saved_job: {
        Args: { p_job_id: number }
        Returns: Json
      }
      get_my_saved_jobs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      increment_poll_vote_count: {
        Args: { p_option_id: number }
        Returns: undefined
      }
      log_job_view: {
        Args: { p_job_id: number }
        Returns: Json
      }
      expire_due_jobs: {
        Args: Record<string, never>
        Returns: number
      }
      schedule_interview: {
        Args: {
          p_application_id: number
          p_scheduled_at: string
          p_duration_minutes: number
          p_location_or_link: string | null
          p_note: string | null
        }
        Returns: Json
      }
      respond_interview: {
        Args: { p_interview_id: number; p_accept: boolean }
        Returns: Json
      }
      get_my_applications: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      resubmit_company_verification: {
        Args: Record<string, never>
        Returns: Json
      }
      count_applications_per_job: {
        Args: { p_job_ids: number[] }
        Returns: { job_id: number; count: number }[]
      }
      get_distinct_audit_actions: {
        Args: Record<string, never>
        Returns: { action: string }[]
      }
    }

    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
