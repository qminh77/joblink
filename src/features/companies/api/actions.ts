"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import { rpcResult } from "@/lib/action/rpc"
import { checkRateLimit } from "@/lib/action/rate-limit"

import {
  createApplicationStatusUpdateSchema,
  createCompanyUserIdSchema,
  createJobStatusUpdateSchema,
  createScheduleInterviewSchema,
  type ScheduleInterviewInput,
} from "../schemas"
import type {
  ResubmitVerificationResult,
  ScheduleInterviewResult,
  ToggleFollowResult,
  UpdateStatusResult,
} from "../types"
import {
  notifyApplicationStatusChanged,
  notifyCompanyFollowed,
  notifyInterviewScheduled,
} from "../services/company-notifications"

type StatusPayload = { noop: boolean; status: string; oldStatus?: string }

/**
 * Toggle follow/unfollow công ty. Idempotent — trả luôn count mới để client
 * cập nhật optimistic.
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
  await checkRateLimit(current.appUser.id, "follow", 20, 60) // 20 follows / 60s
  const supabase = await createClient()

  const result = await rpcResult<{ isFollowing: boolean; followerCount: number }>(
    supabase.rpc("toggle_follow_company", { p_company_user_id: parsed.data }),
  )

  if (result.ok) {
    // Trang public server-rendered → revalidate cho SEO/OG khi refresh.
    revalidatePath(`/company/${parsed.data}`)
    if (result.isFollowing) {
      await notifyCompanyFollowed({ companyUserId: parsed.data, current })
    }
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.isFollowing ? "company.follow" : "company.unfollow",
      entityType: "follows",
      entityId: parsed.data,
    })
  }
  return result
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
  await checkRateLimit(current.appUser.id, "company_action", 10, 60) // 10 / 60s
  const supabase = await createClient()

  const result = await rpcResult<StatusPayload>(
    supabase.rpc("update_application_status", {
      p_application_id: parsed.data.applicationId,
      p_new_status: parsed.data.newStatus,
      p_note: parsed.data.note ?? null,
    }),
  )

  if (result.ok) {
    revalidatePath("/company/dashboard")
    if (!result.noop) {
      await notifyApplicationStatusChanged({
        supabase,
        applicationId: parsed.data.applicationId,
        newStatus: parsed.data.newStatus,
        current,
      })
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "company.application_status_update",
        entityType: "job_applications",
        entityId: parsed.data.applicationId,
        newData: {
          newStatus: parsed.data.newStatus,
          oldStatus: result.oldStatus,
        },
      })
    }
  }
  return result
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

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<StatusPayload>(
    supabase.rpc("update_job_status", {
      p_job_id: parsed.data.jobId,
      p_new_status: parsed.data.newStatus,
    }),
  )

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.job_status_update",
      entityType: "jobs",
      entityId: parsed.data.jobId,
      newData: {
        newStatus: parsed.data.newStatus,
        oldStatus: result.oldStatus,
      },
    })
    revalidatePath("/company/dashboard")
  }
  return result
}

type ScheduleInterviewPayload = {
  interviewId: number
  applicationId: number
  applicantId: number
  jobId: number
  jobTitle: string
  scheduledAt: string
  statusChanged: boolean
}

/**
 * Recruiter tạo / dời lịch phỏng vấn. RPC tự check ownership + chuyển đơn sang
 * 'interview'. Notify ứng viên kèm chi tiết lịch.
 */
export async function scheduleInterviewAction(
  input: ScheduleInterviewInput,
): Promise<ScheduleInterviewResult> {
  const te = await getTranslations("companies.dashboardErrors")
  const parsed = createScheduleInterviewSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  await checkRateLimit(current.appUser.id, "company_action", 10, 60)
  const supabase = await createClient()

  const result = await rpcResult<ScheduleInterviewPayload>(
    supabase.rpc("schedule_interview", {
      p_application_id: parsed.data.applicationId,
      p_scheduled_at: parsed.data.scheduledAt,
      p_duration_minutes: parsed.data.durationMinutes,
      p_location_or_link: parsed.data.locationOrLink ?? null,
      p_note: parsed.data.note ?? null,
    }),
  )

  if (result.ok) {
    revalidatePath("/company/dashboard")
    await notifyInterviewScheduled({
      applicantId: result.applicantId,
      jobId: result.jobId,
      jobTitle: result.jobTitle,
      applicationId: result.applicationId,
      scheduledAt: result.scheduledAt,
      current,
    })
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.interview_schedule",
      entityType: "interview_schedules",
      entityId: result.interviewId,
      newData: {
        applicationId: result.applicationId,
        scheduledAt: result.scheduledAt,
      },
    })
  }
  return result
}

/**
 * Company gửi lại hồ sơ xác minh khi đang ở 'rejected' / 'pending_update'
 * (FR-M02-007). RPC tự check role + trạng thái hợp lệ.
 */
export async function resubmitCompanyVerificationAction(): Promise<ResubmitVerificationResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ status: "pending" }>(
    supabase.rpc("resubmit_company_verification"),
  )

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.verification_resubmit",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: { status: "pending" },
    })
    revalidatePath("/settings")
    revalidatePath("/company/dashboard")
  }
  return result
}
