import { CompanyApplicationsServerPage } from "@/features/jobs/components/company-applications-page"

export const dynamic = "force-dynamic"

export default async function CompanyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const jobRaw = typeof params.job === "string" ? Number(params.job) : null
  const jobId = jobRaw && Number.isInteger(jobRaw) && jobRaw > 0 ? jobRaw : null
  return <CompanyApplicationsServerPage jobId={jobId} />
}
