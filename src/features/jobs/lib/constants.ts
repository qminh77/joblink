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
