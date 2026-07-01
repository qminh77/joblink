import "server-only"

import { revalidatePath } from "next/cache"

export type AdminSection =
  | "companies"
  | "jobs"
  | "posts"
  | "reports"
  | "users"

export function revalidateAdminSection(section: AdminSection) {
  revalidatePath(`/admin/${section}`)
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
}
