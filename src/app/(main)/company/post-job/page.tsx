import { PostJobServerPage } from "@/features/jobs/components/post-job-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function PostJobRoute() {
  await requirePermission("jobs.create")
  return <PostJobServerPage />
}
