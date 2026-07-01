import { SavedJobsServerPage } from "@/features/jobs/components/saved-jobs-page"
import { requireUserRole } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

export default async function SavedJobsRoute() {
  await requireUserRole("member")
  return <SavedJobsServerPage />
}
