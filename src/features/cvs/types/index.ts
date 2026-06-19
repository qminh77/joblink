// Domain types cho feature CV. `MemberCvRow` khớp bảng `member_cvs` (snake_case);
// `MemberCv` là dạng domain (camelCase) để UI/list render dễ hơn.

export type BuilderConfig = {
  experiences: number[]
  educations: number[]
  skills: string[]
}

export type CvSource = "upload" | "builder"

export type MemberCvRow = {
  id: number
  user_id: number
  file_name: string
  storage_path: string
  file_size: number
  mime_type: string
  source: CvSource
  builder_config: BuilderConfig | null
  is_default: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MemberCv = {
  id: number
  fileName: string
  storagePath: string
  fileSize: number
  mimeType: string
  source: CvSource
  builderConfig: BuilderConfig | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CvBuilderProfile = {
  fullName: string
  email: string
  phone: string | null
  headline: string | null
  experiences: {
    id: number
    companyName: string
    position: string
    startDate: string
    endDate: string | null
    isCurrent: boolean
    description: string | null
  }[]
  educations: {
    id: number
    schoolName: string
    degree: string | null
    fieldOfStudy: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
  }[]
  skills: { id: number; name: string }[]
}

export type OwnCvSummary = {
  id: number
  fileName: string
  fileSize: number
  isDefault: boolean
}

export type ApplicantResumeUrl = {
  url: string
  kind: "external" | "signed"
}

export function mapMemberCv(row: MemberCvRow): MemberCv {
  return {
    id: row.id,
    fileName: row.file_name,
    storagePath: row.storage_path,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    source: row.source as CvSource,
    builderConfig: row.builder_config as BuilderConfig | null,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
