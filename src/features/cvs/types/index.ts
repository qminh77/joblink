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
