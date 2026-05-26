import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadProvinces } from "@/features/profile/api/queries"

import {
  loadJobPositions,
  loadJobTypes,
  loadWorkModes,
} from "../api/queries"

import { PostJobForm } from "./post-job-form"

export async function PostJobServerPage() {
  const current = await requireCurrentUser()
  if (current.appUser.role !== "company") notFound()

  const [provinces, jobTypes, workModes, jobPositions] = await Promise.all([
    loadProvinces(),
    loadJobTypes(),
    loadWorkModes(),
    loadJobPositions(),
  ])

  return (
    <PostJobForm
      provinces={provinces}
      jobTypes={jobTypes}
      workModes={workModes}
      jobPositions={jobPositions}
    />
  )
}
