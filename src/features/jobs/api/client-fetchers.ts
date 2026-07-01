"use server"

// Server-action wrappers cho client gọi qua react-query.

import {
  loadJobsList,
  loadMySavedJobs,
  type JobsListFilters,
} from "./queries"
import {
  requireCurrentUser,
  requireUserRole,
} from "@/features/auth/api/auth-server"
import type { JobsListPage, SavedJobsPage } from "../types"

export async function loadJobsListViaAction(
  input: JobsListFilters,
): Promise<JobsListPage> {
  await requireCurrentUser()
  return loadJobsList(input)
}

export async function loadMySavedJobsViaAction(input: {
  limit?: number
  offset?: number
}): Promise<SavedJobsPage> {
  await requireUserRole("member")
  return loadMySavedJobs(input)
}
