import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import {
  loadCompanyApplicantsPage,
  loadCompanyDashboardOverview,
  loadCompanyJobsPage,
  loadCompanyPublicOverview,
} from "../../api/queries"

import { DashboardClient } from "./dashboard-client"

/**
 * Server entry cho /company/dashboard. Owner-only — chặn role ≠ company sớm
 * bằng notFound() (thay vì redirect để không leak vai trò). Tải song song:
 *   • Overview (stats + recent jobs/applicants)
 *   • Trang đầu của tab Jobs và Applicants → mọi tab có data ngay khi mount
 *     (tabs khác bị inactive vẫn cache initialData cho lần focus đầu).
 *   • Tên công ty cho header.
 */
export async function CompanyDashboardServer() {
  const current = await requireCurrentUser()
  if (
    current.appUser.role !== "company" ||
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }

  const [overview, jobsPage, applicantsPage, publicOverview, tDashboard] =
    await Promise.all([
      loadCompanyDashboardOverview(),
      loadCompanyJobsPage({ status: "all", limit: 20, offset: 0 }),
      loadCompanyApplicantsPage({ status: "all", limit: 50, offset: 0 }),
      loadCompanyPublicOverview(current.appUser.id, { jobsLimit: 1 }),
      getTranslations("companies.dashboard"),
    ])

  if (!overview) notFound()

  return (
    <DashboardClient
      companyName={publicOverview?.company.name ?? tDashboard("fallbackCompanyName")}
      initialOverview={overview}
      initialJobs={jobsPage}
      initialApplicants={applicantsPage}
    />
  )
}
