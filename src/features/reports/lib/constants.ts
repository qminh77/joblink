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
