import type { AppealStatus, ModerationActionType } from "@/types/database"

export type CreateReportInput = {
  targetType: "user" | "post" | "comment" | "job" | "company"
  targetId: number
  reason: string
  description?: string | null
}

// ── Khiếu nại (UC-71) ────────────────────────────────────────────────────────

export type MyAppeal = {
  id: number
  status: AppealStatus
  reason: string
  createdAt: string
  reviewedAt: string | null
}

// Một hành động kiểm duyệt cấp tài khoản nhắm vào người dùng hiện tại, kèm đơn
// khiếu nại đã gửi (nếu có).
export type MyModerationAction = {
  id: number
  actionType: ModerationActionType
  reason: string
  createdAt: string
  appeal: MyAppeal | null
}
