import {
  loadJobTypes,
  loadJobsList,
  loadWorkModes,
} from "../api/queries"
import { loadProvinces } from "@/features/profile/api/queries"

import { JobsListClient } from "./jobs-list-client"

type SearchParams = Record<string, string | string[] | undefined>

export async function JobsListPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  // company filter cho trang công ty (link "Xem tất cả việc làm").
  const companyParam = searchParams?.company
  const companyUserId =
    typeof companyParam === "string" && /^\d+$/.test(companyParam)
      ? Number(companyParam)
      : null

  const [provinces, jobTypes, workModes, initialPage] = await Promise.all([
    loadProvinces(),
    loadJobTypes(),
    loadWorkModes(),
    loadJobsList({
      companyUserId,
      offset: 0,
      limit: 20,
    }),
  ])

  return (
    <JobsListClient
      provinces={provinces}
      jobTypes={jobTypes}
      workModes={workModes}
      initialPage={initialPage}
    />
  )
}
