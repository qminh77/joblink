import type { AdminJobRow } from "@/features/admin/api/jobs"

export type JobAdminAction = "remove" | "restore"

export type JobActionTarget = {
  job: AdminJobRow
  action: JobAdminAction
}
