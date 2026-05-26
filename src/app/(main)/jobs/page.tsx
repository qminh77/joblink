import { JobsListPage } from "@/features/jobs/components/jobs-list-page"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function JobsRoute({ searchParams }: PageProps) {
  const params = await searchParams
  return <JobsListPage searchParams={params} />
}
