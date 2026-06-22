import type {
  CompanyVerification,
  ModerationActionType,
  PostType,
  PostVisibility,
  ReportStatus,
  ReportTargetType,
} from "@/types/database"
import type { UserRole, UserStatus } from "@/lib/constants"

export type AdminDashboardStats = {
  totalUsers: number
  newUsers7d: number
  totalCompanies: number
  pendingCompanies: number
  totalJobs: number
  activeJobs: number
  totalApplications: number
  pendingReports: number
  totalPosts: number
  totalConnections: number
}

export type AdminDashboardData = {
  stats: AdminDashboardStats
  roleDist: Partial<Record<UserRole, number>>
  statusDist: Partial<Record<UserStatus, number>>
  verificationDist: Partial<Record<CompanyVerification, number>>
  recentActions: AdminRecentAction[]
}

export type AdminRecentAction = {
  id: number
  action: string
  entityType: string | null
  entityId: number | null
  reason: string | null
  createdAt: string
  actor: { id: number; email: string; displayName: string } | null
}

export type AdminUserRow = {
  id: number
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLoginAt: string | null
  displayName: string
  avatarUrl: string | null
  roleId: number | null
}

export type AdminUserListResult = {
  items: AdminUserRow[]
  total: number
  page: number
  pageSize: number
}

export type ListUsersParams = {
  search?: string
  roleId?: number | "all"
  status?: UserStatus | "all"
  page?: number
  pageSize?: number
}

export type ExportUsersParams = {
  search?: string
  roleId?: string
  status?: string
}

export type UserActionResult =
  | { ok: true; newStatus: UserStatus }
  | { ok: false; error: string }

export type AdminCompanyRow = {
  userId: number
  email: string
  name: string
  slug: string
  logoUrl: string | null
  industry: string | null
  taxId: string | null
  representativeName: string | null
  businessAddress: string | null
  businessEmail: string | null
  website: string | null
  verificationStatus: CompanyVerification
  verificationNote: string | null
  verifiedAt: string | null
  submittedAt: string
}

export type ListCompaniesParams = {
  status?: CompanyVerification | "all"
  search?: string
  limit?: number
}

export type AdminCompanyListResult = {
  items: AdminCompanyRow[]
  counts: Record<CompanyVerification | "all", number>
}

export type CompanyActionResult =
  | { ok: true; status: CompanyVerification }
  | { ok: false; error: string }

export type AdminReportRow = {
  id: number
  reporterId: number
  reporterName: string
  reporterAvatar: string | null
  targetType: ReportTargetType
  targetId: number
  reason: string
  reasonName: string
  description: string | null
  status: ReportStatus
  createdAt: string
  targetAuthorName: string | null
  targetAuthorAvatar: string | null
  targetPreview: {
    label: string
    snippet: string | null
    url: string | null
  }
}

export type AdminPostRow = {
  id: number
  content: string
  postType: PostType
  visibility: PostVisibility
  status: string
  authorId: number
  authorName: string
  authorAvatarUrl: string | null
  authorRole: string
  reactionCount: number
  commentCount: number
  createdAt: string
}

export type ListPostsParams = {
  search?: string
  type?: PostType | "all"
  status?: string
  limit?: number
}

export type ListReportsParams = {
  targetType?: ReportTargetType | "all"
  status?: ReportStatus | "all"
  limit?: number
}

export type AdminActionResult = { ok: boolean; error?: string }

export type AdminAuditLogEntry = {
  id: number
  actorId: number | null
  actorName: string | null
  actorEmail: string | null
  action: string
  entityType: string | null
  entityId: number | null
  oldData: unknown
  newData: unknown
  reason: string | null
  ipAddress: string | null
  createdAt: string
}

export type AdminLookupKind =
  | "provinces"
  | "wards"
  | "job_types"
  | "work_modes"
  | "job_positions"
  | "report_types"
  | "skills"

export type AdminLookupRow = {
  id: number
  code: string
  name: string
  nameEn: string | null
  sortOrder: number
  isActive: boolean
  isSystem?: boolean
  provinceId?: number | null
  parentId?: number | null
}

export type AdminSettingsValue =
  | string
  | number
  | boolean
  | string[]
  | null

export type AdminSettingsMap = Record<string, AdminSettingsValue>

export type AdminModerationActionType = ModerationActionType
