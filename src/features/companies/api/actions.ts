"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createNotification } from "@/features/notifications/lib/create-notification"
import { createClient } from "@/lib/supabase/server"

import {
  createApplicationStatusUpdateSchema,
  createCompanyUserIdSchema,
  createJobStatusUpdateSchema,
} from "../schemas"
import type { ToggleFollowResult, UpdateStatusResult } from "../types"

type ApplicationStatus =
  | "applied"
  | "reviewed"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"

/**
 * Toggle follow/unfollow công ty. Idempotent — gọi 2 lần ⇒ trở về trạng thái
 * ban đầu. Trả luôn count mới để client cập nhật optimistic.
 */
export async function toggleFollowCompanyAction(
  companyUserId: number,
): Promise<ToggleFollowResult> {
  const te = await getTranslations("companies.errors")

  const parsed = createCompanyUserIdSchema(te).safeParse(companyUserId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("toggle_follow_company", {
    p_company_user_id: parsed.data,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; isFollowing: boolean; followerCount: number }
    | { ok: false; error: string }
    | null

  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  // Trang public là server-rendered → revalidate để Open Graph / SEO bot khi
  // refresh có số liệu mới. Client còn dùng react-query để optimistic UI.
  revalidatePath(`/company/${parsed.data}`)

  // Notify company owner khi có follower mới. Unfollow không trigger (tránh
  // spam, đồng thời không có giá trị tin tức).
  if (payload.isFollowing && current.appUser.id !== parsed.data) {
    await createNotification({
      userId: parsed.data,
      type: "company_followed",
      payload: {
        type: "company_followed",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
      },
    })
  }

  return payload
}

// ---------------------------------------------------------------------------
// Dashboard actions (owner-only). RPC tự check role + ownership.
// ---------------------------------------------------------------------------
export async function updateApplicationStatusAction(input: {
  applicationId: number
  newStatus: string
  note?: string | null
}): Promise<UpdateStatusResult> {
  const te = await getTranslations("companies.dashboardErrors")

  const parsed = createApplicationStatusUpdateSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("update_application_status", {
    p_application_id: parsed.data.applicationId,
    p_new_status: parsed.data.newStatus,
    p_note: parsed.data.note ?? null,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; noop: boolean; status: string; oldStatus?: string }
    | { ok: false; error: string }
    | null

  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  revalidatePath("/company/dashboard")

  // Notify applicant khi recruiter đổi status (chỉ khi không phải noop).
  // Lấy applicant_id + job info trong 1 query phụ để dựng payload.
  if (!payload.noop) {
    const { data: appRow } = await supabase
      .from("job_applications")
      .select("applicant_id, job_id, jobs!inner(title)")
      .eq("id", parsed.data.applicationId)
      .maybeSingle<{
        applicant_id: number
        job_id: number
        jobs: { title: string } | null
      }>()

    if (appRow && appRow.applicant_id !== current.appUser.id) {
      const newStatus = parsed.data.newStatus as ApplicationStatus
      await createNotification({
        userId: appRow.applicant_id,
        type: "application_status_changed",
        payload: {
          type: "application_status_changed",
          userId: current.appUser.id,
          displayName: current.profile.displayName,
          avatarUrl: current.profile.avatarUrl,
          jobId: appRow.job_id,
          jobTitle: appRow.jobs?.title ?? "",
          applicationId: parsed.data.applicationId,
          newStatus,
        },
      })
    }
  }

  return payload
}

export async function updateJobStatusAction(input: {
  jobId: number
  newStatus: string
}): Promise<UpdateStatusResult> {
  const te = await getTranslations("companies.dashboardErrors")

  const parsed = createJobStatusUpdateSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  await requireCurrentUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("update_job_status", {
    p_job_id: parsed.data.jobId,
    p_new_status: parsed.data.newStatus,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; noop: boolean; status: string; oldStatus?: string }
    | { ok: false; error: string }
    | null

  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  revalidatePath("/company/dashboard")
  return payload
}
