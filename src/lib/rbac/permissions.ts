import type { ModuleName } from "./modules"
import type { ActionName } from "./actions"

/**
 * Permission name format: "module.action"
 * Ví dụ: "users.view", "posts.moderate", "settings.edit"
 */
export type PermissionName = `${ModuleName}.${ActionName}`

/**
 * Tất cả permissions có sẵn trong hệ thống
 * Được generate từ module × action combinations
 */
export const PERMISSIONS = {
  // Admin shell
  "admin.access": "Khu quản trị - Truy cập",

  // Dashboard
  "dashboard.view": "Bảng điều khiển - Xem",

  // Core app
  "feed.view": "Bảng tin - Xem",
  "search.view": "Tìm kiếm - Xem",
  "network.view": "Mạng lưới - Xem",
  "network.follow": "Mạng lưới - Theo dõi",
  "network.connect": "Mạng lưới - Kết nối",
  "network.block": "Mạng lưới - Chặn",
  "messages.view": "Tin nhắn - Xem",
  "messages.send": "Tin nhắn - Gửi",
  "notifications.view": "Thông báo - Xem",
  "notifications.edit": "Thông báo - Chỉnh sửa",
  "profile.view": "Hồ sơ - Xem",
  "profile.edit": "Hồ sơ - Chỉnh sửa",
  "cvs.view": "CV - Xem",
  "cvs.create": "CV - Tạo mới",
  "cvs.edit": "CV - Chỉnh sửa",
  "cvs.delete": "CV - Xóa",

  // Users
  "users.view": "Quản lý người dùng - Xem",
  "users.create": "Quản lý người dùng - Tạo mới",
  "users.edit": "Quản lý người dùng - Chỉnh sửa",
  "users.delete": "Quản lý người dùng - Xóa",
  "users.export": "Quản lý người dùng - Xuất dữ liệu",
  "users.suspend": "Quản lý người dùng - Khóa tài khoản",
  "users.ban": "Quản lý người dùng - Cấm",
  "users.restore": "Quản lý người dùng - Khôi phục",

  // Companies
  "companies.view": "Quản lý công ty - Xem",
  "companies.follow": "Quản lý công ty - Theo dõi",
  "companies.edit": "Quản lý công ty - Chỉnh sửa",
  "companies.suspend": "Quản lý công ty - Khóa tài khoản",
  "companies.moderate": "Quản lý công ty - Duyệt / Kiểm duyệt",
  "companies.restore": "Quản lý công ty - Khôi phục",

  // Jobs
  "jobs.view": "Quản lý việc làm - Xem",
  "jobs.create": "Quản lý việc làm - Tạo mới",
  "jobs.edit": "Quản lý việc làm - Chỉnh sửa",
  "jobs.apply": "Quản lý việc làm - Ứng tuyển",
  "jobs.save": "Quản lý việc làm - Lưu",
  "jobs.moderate": "Quản lý việc làm - Duyệt / Kiểm duyệt",
  "jobs.delete": "Quản lý việc làm - Xóa",

  // Posts
  "posts.view": "Quản lý bài viết - Xem",
  "posts.create": "Quản lý bài viết - Tạo mới",
  "posts.edit": "Quản lý bài viết - Chỉnh sửa",
  "posts.comment": "Quản lý bài viết - Bình luận",
  "posts.react": "Quản lý bài viết - Tương tác",
  "posts.share": "Quản lý bài viết - Chia sẻ",
  "posts.vote": "Quản lý bài viết - Bình chọn",
  "posts.moderate": "Quản lý bài viết - Duyệt / Kiểm duyệt",
  "posts.delete": "Quản lý bài viết - Xóa",

  // Reports
  "reports.create": "Quản lý báo cáo - Tạo mới",
  "reports.view": "Quản lý báo cáo - Xem",
  "reports.moderate": "Quản lý báo cáo - Duyệt / Kiểm duyệt",
  "reports.status": "Quản lý báo cáo - Đổi trạng thái",

  // Audit
  "audit.view": "Nhật ký hoạt động - Xem",

  // Report Types
  "report_types.view": "Loại báo cáo - Xem",
  "report_types.create": "Loại báo cáo - Tạo mới",
  "report_types.edit": "Loại báo cáo - Chỉnh sửa",
  "report_types.delete": "Loại báo cáo - Xóa",

  // Settings
  "settings.view": "Cài đặt hệ thống - Xem",
  "settings.edit": "Cài đặt hệ thống - Chỉnh sửa",

  // Roles
  "roles.view": "Quản lý quyền - Xem",
  "roles.create": "Quản lý quyền - Tạo mới",
  "roles.edit": "Quản lý quyền - Chỉnh sửa",
  "roles.delete": "Quản lý quyền - Xóa",
} as const

export type PermissionKey = keyof typeof PERMISSIONS

/**
 * Lấy tất cả permission names
 */
export function getAllPermissionNames(): PermissionName[] {
  return Object.keys(PERMISSIONS) as PermissionName[]
}

/**
 * Lấy permissions theo module
 */
export function getPermissionsByModule(module: ModuleName): PermissionName[] {
  return getAllPermissionNames().filter((p) => p.startsWith(`${module}.`))
}

/**
 * Kiểm tra permission name có hợp lệ không
 */
export function isValidPermissionName(name: string): name is PermissionName {
  return name in PERMISSIONS
}
