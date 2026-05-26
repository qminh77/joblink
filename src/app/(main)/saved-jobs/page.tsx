import { SavedJobsServerPage } from "@/features/jobs/components/saved-jobs-page"

export const dynamic = "force-dynamic"

export default async function SavedJobsRoute() {
  return <SavedJobsServerPage />
}
