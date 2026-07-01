import { JobsListPage } from "@/features/jobs/components/jobs-list-page"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function JobsRoute({ searchParams }: PageProps) {
  await requireCurrentUser()
  const params = await searchParams
  return <JobsListPage searchParams={params} />
}
