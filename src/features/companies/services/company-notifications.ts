import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { createNotification } from "@/features/notifications/lib/create-notification"
import type { createClient } from "@/lib/supabase/server"

import { getApplicationApplicantForNotify } from "../data/companies.repo"

type Supabase = Awaited<ReturnType<typeof createClient>>

type ApplicationStatus =
  | "applied"
  | "reviewed"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"

// Notify follower mới cho chủ công ty. Unfollow KHÔNG trigger (tránh spam).
export async function notifyCompanyFollowed(opts: {
  companyUserId: number
  current: CurrentUser
}): Promise<void> {
  if (opts.current.appUser.id === opts.companyUserId) return
  await createNotification({
    userId: opts.companyUserId,
    type: "company_followed",
    payload: {
      type: "company_followed",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
    },
  })
}

// Notify ứng viên khi recruiter gửi/dời lịch phỏng vấn.
export async function notifyInterviewScheduled(opts: {
  applicantId: number
  jobId: number
  jobTitle: string
  applicationId: number
  scheduledAt: string
  current: CurrentUser
}): Promise<void> {
  if (opts.applicantId === opts.current.appUser.id) return
  await createNotification({
    userId: opts.applicantId,
    type: "interview_scheduled",
    payload: {
      type: "interview_scheduled",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      jobId: opts.jobId,
      jobTitle: opts.jobTitle,
      applicationId: opts.applicationId,
      scheduledAt: opts.scheduledAt,
    },
  })
}

// Notify ứng viên khi recruiter đổi trạng thái đơn (caller đã loại trường noop).
export async function notifyApplicationStatusChanged(opts: {
  supabase: Supabase
  applicationId: number
  newStatus: string
  current: CurrentUser
}): Promise<void> {
  const { data: appRow } = await getApplicationApplicantForNotify(
    opts.supabase,
    opts.applicationId,
  )
  if (!appRow || appRow.applicant_id === opts.current.appUser.id) return
  await createNotification({
    userId: appRow.applicant_id,
    type: "application_status_changed",
    payload: {
      type: "application_status_changed",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      jobId: appRow.job_id,
      jobTitle: appRow.jobs?.title ?? "",
      applicationId: opts.applicationId,
      newStatus: opts.newStatus as ApplicationStatus,
    },
  })
}
