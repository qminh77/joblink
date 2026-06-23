export type JobListItem = {
  id: number
  title: string
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  createdAt: string
  expiresAt: string | null
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
  companyVerified: boolean
  provinceName: string | null
  wardName: string | null
  jobTypeName: string | null
  workModeName: string | null
  viewerSaved: boolean
  viewerApplied: boolean
}

export type JobsListPage = {
  items: JobListItem[]
  total: number
}

export type JobDetailCore = {
  id: number
  title: string
  description: string
  requirements: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  status: "draft" | "active" | "closed" | "expired" | "removed"
  createdAt: string
  expiresAt: string | null
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
  companyIndustry: string | null
  companyAbout: string | null
  companySize: string | null
  companyVerified: boolean
  provinceName: string | null
  wardName: string | null
  jobTypeName: string | null
  workModeName: string | null
  jobPositionName: string | null
  positionTitle: string | null
}

export type JobDetailViewer = {
  isOwner: boolean
  viewerSaved: boolean
  viewerApplied: boolean
  applicationStatus: string | null
  applicationId: number | null
}

export type JobDetail = {
  job: JobDetailCore
  skills: string[]
  viewer: JobDetailViewer
}

export type SavedJobItem = {
  id: number
  title: string
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  jobStatus: string
  savedAt: string
  createdAt: string
  expiresAt: string | null
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
  provinceName: string | null
  wardName: string | null
  jobTypeName: string | null
  workModeName: string | null
}

export type SavedJobsPage = {
  items: SavedJobItem[]
  total: number
}

export type CreateJobInput = {
  title: string
  description: string
  requirements?: string | null
  provinceId?: number | null
  wardId?: number | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryVisible?: boolean
  jobTypeId: number
  workModeId: number
  positionTitle?: string | null
  status: "draft" | "active"
  expiresAt?: string | null
  skills?: string[]
}

export type CreateJobResult =
  | { ok: true; jobId: number }
  | { ok: false; error: string }

export type UpdateJobInput = Omit<CreateJobInput, "status"> & { jobId: number }

export type UpdateJobResult = CreateJobResult

export type JobEditCore = {
  id: number
  title: string
  description: string
  requirements: string | null
  provinceId: number | null
  wardId: number | null
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  jobTypeId: number
  workModeId: number
  positionTitle: string | null
  status: "draft" | "active" | "closed" | "expired" | "removed"
  expiresAt: string | null
}

export type JobEditData = {
  job: JobEditCore
  skills: string[]
}

export type ApplyResult =
  | { ok: true; applicationId: number; status: string }
  | { ok: false; error: string }

export type ToggleSavedResult =
  | { ok: true; saved: boolean }
  | { ok: false; error: string }

export type WithdrawResult =
  | { ok: true; status: string }
  | { ok: false; error: string }

export type JobAlertFilters = {
  search?: string | null
  provinceId?: number | null
  jobTypeIds?: number[] | null
  workModeIds?: number[] | null
  salaryMin?: number | null
}

export type JobAlert = {
  id: number
  name: string
  filters: JobAlertFilters
  alertEnabled: boolean
  createdAt: string
}

export type ApplicationStatusValue =
  | "submitted"
  | "withdrawn"
  | "closed"

export type MyApplicationItem = {
  applicationId: number
  status: ApplicationStatusValue
  appliedAt: string
  updatedAt: string
  jobId: number
  jobTitle: string
  jobStatus: string
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
}

export type MyApplicationsPage = {
  items: MyApplicationItem[]
  total: number
}

export type JobTypeRef = { id: number; code: string; name: string }
export type WorkModeRef = { id: number; code: string; name: string }
