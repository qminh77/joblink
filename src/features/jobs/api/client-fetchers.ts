"use server"

// Server-action wrappers cho client gọi qua react-query.

import {
  loadJobsList,
  loadMySavedJobs,
  type JobsListFilters,
} from "./queries"
import { requirePermission } from "@/lib/rbac"
import type { JobsListPage, SavedJobsPage } from "../types"

export async function loadJobsListViaAction(
  input: JobsListFilters,
): Promise<JobsListPage> {
  await requirePermission("jobs.view")
  return loadJobsList(input)
}

export async function loadMySavedJobsViaAction(input: {
  limit?: number
  offset?: number
}): Promise<SavedJobsPage> {
  await requirePermission("jobs.save")
  return loadMySavedJobs(input)
}
