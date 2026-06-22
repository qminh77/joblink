import { JobsListPage } from "@/features/jobs/components/jobs-list-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function JobsRoute({ searchParams }: PageProps) {
  await requirePermission("jobs.view")
  const params = await searchParams
  return <JobsListPage searchParams={params} />
}
