import { notFound } from "next/navigation"

import { EditJobServerPage } from "@/features/jobs/components/post-job-page"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditJobRoute({ params }: PageProps) {
  const { id } = await params
  const jobId = Number(id)
  if (!Number.isInteger(jobId) || jobId <= 0) notFound()
  return <EditJobServerPage jobId={jobId} />
}
