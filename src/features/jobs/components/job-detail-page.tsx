import { notFound } from "next/navigation"

import { loadJobDetail } from "../api/queries"

import { JobDetailClient } from "./job-detail-client"
import { JobViewLogger } from "./job-view-logger"

export async function JobDetailServerPage({ jobId }: { jobId: number }) {
  const detail = await loadJobDetail(jobId)
  if (!detail) notFound()
  return (
    <>
      {!detail.viewer.isOwner ? <JobViewLogger jobId={jobId} /> : null}
      <JobDetailClient detail={detail} />
    </>
  )
}
