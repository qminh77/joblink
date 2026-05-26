import { notFound } from "next/navigation"

import { loadJobDetail } from "../api/queries"

import { JobDetailClient } from "./job-detail-client"

export async function JobDetailServerPage({ jobId }: { jobId: number }) {
  const detail = await loadJobDetail(jobId)
  if (!detail) notFound()
  return <JobDetailClient detail={detail} />
}
