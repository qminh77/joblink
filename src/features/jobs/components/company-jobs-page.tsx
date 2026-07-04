import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { loadManagedCompanyJobs } from "../api/company-management"

import { CompanyJobsClient } from "./company-jobs-client"

export async function CompanyJobsServerPage() {
  const current = await requireCurrentUser()
  if (
    current.appUser.role !== "company" ||
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }

  const page = await loadManagedCompanyJobs(current.appUser.id)
  return <CompanyJobsClient items={page.items} total={page.total} />
}
