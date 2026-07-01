import { PostJobServerPage } from "@/features/jobs/components/post-job-page"
import { requireUserRole } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

export default async function PostJobRoute() {
  await requireUserRole("company")
  return <PostJobServerPage />
}
