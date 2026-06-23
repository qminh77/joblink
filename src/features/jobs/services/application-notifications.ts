import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { createNotification } from "@/features/notifications/lib/create-notification"
import type { createClient } from "@/lib/supabase/server"

import {
  getApplicationJobForNotify,
  getJobOwnerForNotify,
} from "../data/jobs.repo"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function notifyApplicationReceived(opts: {
  supabase: Supabase
  jobId: number
  applicationId: number
  current: CurrentUser
}): Promise<void> {
  const { data: job } = await getJobOwnerForNotify(opts.supabase, opts.jobId)
  if (!job || job.company_user_id === opts.current.appUser.id) return
  await createNotification({
    userId: job.company_user_id,
    type: "job_application_received",
    payload: {
      type: "job_application_received",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      jobId: opts.jobId,
      jobTitle: job.title,
      applicationId: opts.applicationId,
    },
  })
}

export async function notifyApplicationWithdrawn(opts: {
  supabase: Supabase
  applicationId: number
  current: CurrentUser
}): Promise<void> {
  const { data: appRow } = await getApplicationJobForNotify(
    opts.supabase,
    opts.applicationId,
  )
  if (!appRow?.jobs || appRow.jobs.company_user_id === opts.current.appUser.id) {
    return
  }
  await createNotification({
    userId: appRow.jobs.company_user_id,
    type: "application_withdrawn",
    payload: {
      type: "application_withdrawn",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      jobId: appRow.job_id,
      jobTitle: appRow.jobs.title,
      applicationId: opts.applicationId,
    },
  })
}
