export const USER_ROLES = ["member", "company", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "banned",
  "deleted",
] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const COMPANY_VERIFICATION_STATUSES = [
  "pending",
  "pending_update",
  "verified",
  "rejected",
  "suspended",
] as const
export type CompanyVerificationStatus =
  (typeof COMPANY_VERIFICATION_STATUSES)[number]

export const JOB_TYPES = [
  "fulltime",
  "parttime",
  "internship",
  "contract",
  "freelance",
] as const
export type JobType = (typeof JOB_TYPES)[number]

export const JOB_WORK_MODES = ["onsite", "remote", "hybrid"] as const
export type JobWorkMode = (typeof JOB_WORK_MODES)[number]

export const JOB_STATUSES = [
  "draft",
  "active",
  "closed",
  "expired",
  "removed",
] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const APPLICATION_STATUSES = [
  "submitted",
  "withdrawn",
  "closed",
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const POST_TYPES = ["text", "image", "video", "article"] as const
export type PostType = (typeof POST_TYPES)[number]

export const POST_VISIBILITIES = ["public", "connections", "private"] as const
export type PostVisibility = (typeof POST_VISIBILITIES)[number]

export const REACTION_TYPES = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export const CONNECTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "blocked",
] as const
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number]

export const REPORT_TARGET_TYPES = [
  "user",
  "post",
  "comment",
  "job",
  "company",
] as const
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]

export const REPORT_STATUSES = [
  "pending",
  "in_review",
  "resolved",
  "dismissed",
] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
