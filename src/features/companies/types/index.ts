export type CompanyPublicCore = {
  userId: number
  companyId: number
  name: string
  slug: string
  logoUrl: string | null
  coverUrl: string | null
  about: string | null
  website: string | null
  phone: string | null
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
  wardName: string | null
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
  wardName: string | null
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

export type UpdateStatusResult =
  | { ok: true; noop: boolean; status: string; oldStatus?: string }
  | { ok: false; error: string }

export type ResubmitVerificationResult =
  | { ok: true; status: "pending" }
  | { ok: false; error: string }
