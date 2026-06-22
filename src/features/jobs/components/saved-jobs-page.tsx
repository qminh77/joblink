import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { loadMySavedJobs } from "../api/queries"

import { SavedJobsClient } from "./saved-jobs-client"

export async function SavedJobsServerPage() {
  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") notFound()

  const initial = await loadMySavedJobs({ limit: 20, offset: 0 })
  return <SavedJobsClient initialData={initial} />
}
