import "server-only"

import type { JobListItem } from "@/features/jobs/types"
import type { SearchPageJob } from "../types"

export function mapJobToSearchPage(job: JobListItem): SearchPageJob {
  return {
    id: job.id,
    title: job.title,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryVisible: job.salaryVisible,
    createdAt: job.createdAt,
    companyUserId: job.companyUserId,
    companyName: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    companyVerified: job.companyVerified,
    provinceName: job.provinceName,
    jobTypeName: job.jobTypeName,
    workModeName: job.workModeName,
    viewerSaved: job.viewerSaved,
  }
}
