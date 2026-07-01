import { PostJobServerPage } from "@/features/jobs/components/post-job-page"

export const dynamic = "force-dynamic"

export default async function PostJobRoute() {
  return <PostJobServerPage />
}
