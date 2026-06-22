import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadProvinces } from "@/features/profile/api/queries"

import { loadJobForEdit, loadJobTypes, loadWorkModes } from "../api/queries"

import { PostJobForm } from "./post-job-form"

export async function PostJobServerPage() {
  const current = await requireCurrentUser()
  if (
    current.appUser.account_type !== "company" ||
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }

  const [provinces, jobTypes, workModes] = await Promise.all([
    loadProvinces(),
    loadJobTypes(),
    loadWorkModes(),
  ])

  return (
    <PostJobForm
      provinces={provinces}
      jobTypes={jobTypes}
      workModes={workModes}
    />
  )
}

export async function EditJobServerPage({ jobId }: { jobId: number }) {
  const current = await requireCurrentUser()
  if (
    current.appUser.account_type !== "company" ||
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }

  const [provinces, jobTypes, workModes, editJob] = await Promise.all([
    loadProvinces(),
    loadJobTypes(),
    loadWorkModes(),
    loadJobForEdit(jobId),
  ])

  // RPC trả null nếu tin không tồn tại hoặc không phải chủ tin → 404.
  if (!editJob) notFound()

  return (
    <PostJobForm
      provinces={provinces}
      jobTypes={jobTypes}
      workModes={workModes}
      editJob={editJob}
    />
  )
}
