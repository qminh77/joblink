import { SavedJobsServerPage } from "@/features/jobs/components/saved-jobs-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function SavedJobsRoute() {
  await requirePermission("jobs.save")
  return <SavedJobsServerPage />
}
