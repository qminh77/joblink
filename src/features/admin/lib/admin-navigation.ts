const ADMIN_ENTRY_ITEMS = [
  "/admin/dashboard",
  "/admin/users",
  "/admin/companies",
  "/admin/jobs",
  "/admin/posts",
  "/admin/reports",
  "/admin/audit-log",
] as const

export function getAdminEntryHref(role: string): string | null {
  return role === "admin" ? ADMIN_ENTRY_ITEMS[0] : null
}
