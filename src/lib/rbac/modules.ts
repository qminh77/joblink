export const MODULES = [
  "dashboard",
  "users",
  "companies",
  "jobs",
  "posts",
  "reports",
  "appeals",
  "audit",
  "contacts",
  "brand",
  "report_types",
  "lookups",
  "settings",
  "roles",
] as const

export type ModuleName = (typeof MODULES)[number]

export const MODULE_LABELS: Record<ModuleName, string> = {
  dashboard: "Bảng điều khiển",
  users: "Quản lý người dùng",
  companies: "Quản lý công ty",
  jobs: "Quản lý việc làm",
  posts: "Quản lý bài viết",
  reports: "Quản lý báo cáo",
  appeals: "Quản lý kháng nghị",
  audit: "Nhật ký hoạt động",
  contacts: "Liên hệ hỗ trợ",
  brand: "Thương hiệu",
  report_types: "Loại báo cáo",
  lookups: "Danh mục",
  settings: "Cài đặt hệ thống",
  roles: "Quản lý quyền",
}
