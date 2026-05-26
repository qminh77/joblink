import { listAdminJobs } from "@/features/admin/api/jobs"
import { JobsPanel } from "@/features/admin/components/jobs-panel"
import { JOB_STATUSES, type JobStatus } from "@/lib/constants"

export const dynamic = "force-dynamic"

function asStatus(v?: string): JobStatus | "all" | undefined {
  if (!v) return undefined
  if (v === "all" || (JOB_STATUSES as readonly string[]).includes(v))
    return v as JobStatus | "all"
  return undefined
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const status = asStatus(
    typeof params.status === "string" ? params.status : undefined,
  )
  const search = typeof params.q === "string" ? params.q : undefined
  const items = await listAdminJobs({
    status: status ?? "all",
    search,
    limit: 100,
  })
  return <JobsPanel items={items} query={{ status, search }} />
}
