/**
 * Shape khớp với RPC `get_company_public_overview` (migration 016). Camel-case
 * vì RPC trả về jsonb dạng camelCase để client dùng thẳng không cần map.
 */
export type CompanyPublicCore = {
  userId: number
  companyId: number
  name: string
  slug: string
  logoUrl: string | null
  about: string | null
  website: string | null
  industry: string | null
  size: string | null
  openToHire: boolean
  verificationStatus:
    | "pending"
    | "pending_update"
    | "verified"
    | "rejected"
    | "suspended"
  provinceName: string | null
  districtName: string | null
  businessAddress: string | null
  businessEmail: string | null
  representativeName: string | null
  representativeTitle: string | null
  createdAt: string
}

export type CompanyActiveJobPreview = {
  id: number
  title: string
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  provinceName: string | null
  districtName: string | null
  jobTypeName: string | null
  workModeName: string | null
  createdAt: string
}

export type CompanyPublicOverview = {
  company: CompanyPublicCore
  jobsCount: number
  followerCount: number
  isFollowing: boolean
  isOwner: boolean
  jobs: CompanyActiveJobPreview[]
}

export type ToggleFollowResult =
  | { ok: true; isFollowing: boolean; followerCount: number }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Dashboard (owner-facing) — khớp với RPC migration 017
// ---------------------------------------------------------------------------
export type DashboardJobStatus =
  | "draft"
  | "active"
  | "closed"
  | "expired"
  | "removed"

export type DashboardAppStatus =
  | "applied"
  | "reviewed"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn"

export type DashboardStats = {
  activeJobs: number
  totalApplications: number
  applicationsThisMonth: number
  hireRate: number
}

export type DashboardRecentJob = {
  id: number
  title: string
  status: DashboardJobStatus
  createdAt: string
  expiresAt: string | null
  applicantCount: number
}

export type DashboardRecentApplicant = {
  applicationId: number
  applicantId: number
  displayName: string
  avatarUrl: string | null
  headline: string | null
  jobId: number
  jobTitle: string
  status: DashboardAppStatus
  appliedAt: string
}

export type DashboardOverview = {
  stats: DashboardStats
  recentJobs: DashboardRecentJob[]
  recentApplicants: DashboardRecentApplicant[]
}

export type DashboardJobsPage = {
  items: DashboardRecentJob[]
  total: number
}

export type DashboardApplicantItem = DashboardRecentApplicant & {
  coverLetter: string | null
  resumeUrl: string | null
}

export type DashboardApplicantsPage = {
  items: DashboardApplicantItem[]
  total: number
}

export type JobStatusFilter = "all" | "active" | "draft" | "closed" | "expired"

export type UpdateStatusResult =
  | { ok: true; noop: boolean; status: string; oldStatus?: string }
  | { ok: false; error: string }
