import type { PermissionName } from "@/lib/rbac/permissions"

const ADMIN_ENTRY_ITEMS = [
  { href: "/admin/dashboard", requiredPermission: "dashboard.view" },
  { href: "/admin/users", requiredPermission: "users.view" },
  { href: "/admin/companies", requiredPermission: "companies.view" },
  { href: "/admin/jobs", requiredPermission: "jobs.view" },
  { href: "/admin/posts", requiredPermission: "posts.view" },
  { href: "/admin/reports", requiredPermission: "reports.view" },
  { href: "/admin/appeals", requiredPermission: "appeals.view" },
  { href: "/admin/audit-log", requiredPermission: "audit.view" },
  { href: "/admin/contact-submissions", requiredPermission: "contacts.view" },
  { href: "/admin/roles", requiredPermission: "roles.view" },
  { href: "/admin/brand", requiredPermission: "brand.view" },
  { href: "/admin/report-types", requiredPermission: "report_types.view" },
  { href: "/admin/lookups", requiredPermission: "lookups.view" },
  { href: "/admin/settings", requiredPermission: "settings.view" },
] as const satisfies Array<{
  href: string
  requiredPermission: PermissionName
}>

export function getAdminEntryHref(
  permissions: readonly string[],
): string | null {
  const permissionSet = new Set(permissions)
  return (
    ADMIN_ENTRY_ITEMS.find((item) =>
      permissionSet.has(item.requiredPermission),
    )?.href ?? null
  )
}
