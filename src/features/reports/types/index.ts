export type CreateReportInput = {
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
  reason: string
  description?: string | null
}

export type ReportReasonOption = {
  id: number
  code: string
  name: string
  nameEn: string | null
}
