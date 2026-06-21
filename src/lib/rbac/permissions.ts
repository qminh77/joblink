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
  // Dashboard
  "dashboard.view": "Bảng điều khiển - Xem",

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
  "companies.edit": "Quản lý công ty - Chỉnh sửa",
  "companies.suspend": "Quản lý công ty - Khóa tài khoản",
  "companies.moderate": "Quản lý công ty - Duyệt / Kiểm duyệt",
  "companies.restore": "Quản lý công ty - Khôi phục",

  // Jobs
  "jobs.view": "Quản lý việc làm - Xem",
  "jobs.moderate": "Quản lý việc làm - Duyệt / Kiểm duyệt",
  "jobs.delete": "Quản lý việc làm - Xóa",

  // Posts
  "posts.view": "Quản lý bài viết - Xem",
  "posts.moderate": "Quản lý bài viết - Duyệt / Kiểm duyệt",
  "posts.delete": "Quản lý bài viết - Xóa",

  // Reports
  "reports.view": "Quản lý báo cáo - Xem",
  "reports.moderate": "Quản lý báo cáo - Duyệt / Kiểm duyệt",
  "reports.status": "Quản lý báo cáo - Đổi trạng thái",

  // Appeals
  "appeals.view": "Quản lý kháng nghị - Xem",
  "appeals.moderate": "Quản lý kháng nghị - Duyệt / Kiểm duyệt",

  // Audit
  "audit.view": "Nhật ký hoạt động - Xem",

  // Contacts
  "contacts.view": "Liên hệ hỗ trợ - Xem",
  "contacts.reply": "Liên hệ hỗ trợ - Trả lời",

  // Brand
  "brand.view": "Thương hiệu - Xem",
  "brand.edit": "Thương hiệu - Chỉnh sửa",

  // Report Types
  "report_types.view": "Loại báo cáo - Xem",
  "report_types.create": "Loại báo cáo - Tạo mới",
  "report_types.edit": "Loại báo cáo - Chỉnh sửa",
  "report_types.delete": "Loại báo cáo - Xóa",

  // Lookups
  "lookups.view": "Danh mục - Xem",
  "lookups.create": "Danh mục - Tạo mới",
  "lookups.edit": "Danh mục - Chỉnh sửa",
  "lookups.delete": "Danh mục - Xóa",

  // Settings
  "settings.view": "Cài đặt hệ thống - Xem",
  "settings.edit": "Cài đặt hệ thống - Chỉnh sửa",
  "settings.maintenance": "Cài đặt hệ thống - Bật/tắt bảo trì",

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
