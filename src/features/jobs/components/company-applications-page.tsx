import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { loadManagedCompanyApplications } from "../api/company-management"

import { CompanyApplicationsClient } from "./company-applications-client"

export async function CompanyApplicationsServerPage({
  jobId,
}: {
  jobId?: number | null
}) {
  const current = await requireCurrentUser()
  if (
    current.appUser.role !== "company" ||
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }

  const page = await loadManagedCompanyApplications(current.appUser.id, { jobId })
  return <CompanyApplicationsClient items={page.items} jobs={page.jobs} total={page.total} />
}
