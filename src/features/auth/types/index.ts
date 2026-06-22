import type { UserRole, UserStatus } from "@/lib/constants"
import type { AppUserRow, CompanyVerification } from "@/types/database"

export type CurrentUser = {
  appUser: AppUserRow
  profile: {
    displayName: string
    avatarUrl: string | null
    coverUrl: string | null
    headline: string | null
    companyVerificationStatus?: CompanyVerification | null
  }
}

export type SessionUserSummary = {
  id: number
  authId: string
  email: string
  role: UserRole
  status: UserStatus
  displayName: string
  avatarUrl: string | null
  coverUrl: string | null
  headline: string | null
  companyVerificationStatus?: CompanyVerification | null
  permissions: string[]
  adminHref?: string | null
}
