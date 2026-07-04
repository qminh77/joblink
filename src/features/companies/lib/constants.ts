export const COMPANY_VERIFICATION_STATUSES = [
  "pending",
  "pending_update",
  "verified",
  "rejected",
  "suspended",
] as const
export type CompanyVerificationStatus =
  (typeof COMPANY_VERIFICATION_STATUSES)[number]

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const
export type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]
