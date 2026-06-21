export const ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "suspend",
  "ban",
  "restore",
  "moderate",
  "status",
  "reply",
  "maintenance",
] as const

export type ActionName = (typeof ACTIONS)[number]

export const ACTION_LABELS: Record<ActionName, string> = {
  view: "Xem",
  create: "Tạo mới",
  edit: "Chỉnh sửa",
  delete: "Xóa",
  export: "Xuất dữ liệu",
  suspend: "Khóa tài khoản",
  ban: "Cấm",
  restore: "Khôi phục",
  moderate: "Duyệt / Kiểm duyệt",
  status: "Đổi trạng thái",
  reply: "Trả lời",
  maintenance: "Bật/tắt bảo trì",
}
