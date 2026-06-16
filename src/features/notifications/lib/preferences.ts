import type { NotificationType } from "@/types/database"

// 5 nhóm thông báo hiển thị cho người dùng (UC-65). Mỗi loại notification thực
// tế thuộc đúng một nhóm; người dùng bật/tắt theo nhóm cho gọn thay vì 14 loại.
export const NOTIFICATION_CATEGORIES = [
  "like",
  "comment",
  "newConnection",
  "message",
  "jobMatch",
] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]

// Ánh xạ loại notification → nhóm. Dùng chung cho việc gate khi TẠO notification
// (server) và hiển thị Cài đặt (client). Kiểu Record buộc liệt kê đủ mọi
// NotificationType — thêm loại mới mà quên map sẽ lỗi biên dịch.
export const CATEGORY_BY_TYPE: Record<NotificationType, NotificationCategory> = {
  post_reaction: "like",
  poll_vote: "like",
  post_comment: "comment",
  comment_mention: "comment",
  post_share: "comment",
  connection_request: "newConnection",
  connection_accepted: "newConnection",
  company_followed: "newConnection",
  new_message: "message",
  job_application_received: "jobMatch",
  application_status_changed: "jobMatch",
  application_withdrawn: "jobMatch",
  interview_scheduled: "jobMatch",
  interview_response: "jobMatch",
}

export type NotificationChannelPref = {
  inApp: boolean
  email: boolean
}

export type NotificationPreferenceMap = Record<
  NotificationCategory,
  NotificationChannelPref
>

// Mặc định: in-app BẬT, email TẮT (opt-in) khi chưa có cấu hình — tránh spam
// hộp thư. Người dùng tự bật Email cho từng nhóm trong Cài đặt thông báo.
export const DEFAULT_CHANNEL_PREF: NotificationChannelPref = {
  inApp: true,
  email: false,
}

export function defaultPreferenceMap(): NotificationPreferenceMap {
  return {
    like: { ...DEFAULT_CHANNEL_PREF },
    comment: { ...DEFAULT_CHANNEL_PREF },
    newConnection: { ...DEFAULT_CHANNEL_PREF },
    message: { ...DEFAULT_CHANNEL_PREF },
    jobMatch: { ...DEFAULT_CHANNEL_PREF },
  }
}
