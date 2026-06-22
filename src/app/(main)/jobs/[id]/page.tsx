import { notFound } from "next/navigation"

import { JobDetailServerPage } from "@/features/jobs/components/job-detail-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function JobDetailRoute({ params }: PageProps) {
  await requirePermission("jobs.view")
  const { id } = await params
  const jobId = Number(id)
  if (!Number.isInteger(jobId) || jobId <= 0) notFound()
  return <JobDetailServerPage jobId={jobId} />
}
