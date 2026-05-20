export type CreateReportInput = {
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
  reason: string
  description?: string | null
}
