"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { rpcResult } from "@/lib/action/rpc"

import {
  createApplicationIdSchema,
  createApplySchema,
  createJobIdSchema,
  createJobSchema,
} from "../schemas"
import type {
  ApplyResult,
  CreateJobInput,
  CreateJobResult,
  RespondInterviewResult,
  ToggleSavedResult,
  WithdrawResult,
} from "../types"
import {
  notifyApplicationReceived,
  notifyApplicationWithdrawn,
  notifyInterviewResponse,
} from "../services/application-notifications"

export async function createJobAction(
  input: CreateJobInput,
): Promise<CreateJobResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createJobSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ jobId: number }>(
    supabase.rpc("create_job", {
      p_title: parsed.data.title,
      p_description: parsed.data.description,
      p_requirements: parsed.data.requirements ?? null,
      p_province_id: parsed.data.provinceId ?? null,
      p_district_id: parsed.data.districtId ?? null,
      p_salary_min: parsed.data.salaryMin ?? null,
      p_salary_max: parsed.data.salaryMax ?? null,
      p_salary_visible: parsed.data.salaryVisible,
      p_job_type_id: parsed.data.jobTypeId,
      p_work_mode_id: parsed.data.workModeId,
      p_job_position_id: parsed.data.jobPositionId ?? null,
      p_status: parsed.data.status,
      p_expires_at: parsed.data.expiresAt ?? null,
      p_skills: parsed.data.skills ?? null,
    }),
  )

  if (result.ok) {
    revalidatePath("/jobs")
    revalidatePath("/company/dashboard")
  }
  return result
}

export async function applyToJobAction(input: {
  jobId: number
  coverLetter?: string | null
  resumeUrl?: string | null
}): Promise<ApplyResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createApplySchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ applicationId: number; status: string }>(
    supabase.rpc("apply_to_job", {
      p_job_id: parsed.data.jobId,
      p_cover_letter: parsed.data.coverLetter ?? null,
      p_resume_url: parsed.data.resumeUrl ?? null,
    }),
  )

  if (result.ok) {
    revalidatePath(`/jobs/${parsed.data.jobId}`)
    await notifyApplicationReceived({
      supabase,
      jobId: parsed.data.jobId,
      applicationId: result.applicationId,
      current,
    })
  }
  return result
}

export async function withdrawApplicationAction(
  applicationId: number,
): Promise<WithdrawResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createApplicationIdSchema(te).safeParse(applicationId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ status: string }>(
    supabase.rpc("withdraw_application", { p_application_id: parsed.data }),
  )

  if (result.ok) {
    await notifyApplicationWithdrawn({
      supabase,
      applicationId: parsed.data,
      current,
    })
  }
  return result
}

export async function toggleSavedJobAction(
  jobId: number,
): Promise<ToggleSavedResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createJobIdSchema(te).safeParse(jobId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ saved: boolean }>(
    supabase.rpc("toggle_saved_job", { p_job_id: parsed.data }),
  )

  if (result.ok) revalidatePath("/saved-jobs")
  return result
}

/**
 * Ứng viên xác nhận / từ chối lịch phỏng vấn. RPC tự check chủ đơn. Notify
 * recruiter kèm kết quả.
 */
export async function respondInterviewAction(input: {
  interviewId: number
  accept: boolean
}): Promise<RespondInterviewResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{
    status: "confirmed" | "declined"
    companyUserId: number
    jobId: number
    jobTitle: string
    applicationId: number
  }>(
    supabase.rpc("respond_interview", {
      p_interview_id: input.interviewId,
      p_accept: input.accept,
    }),
  )

  if (result.ok) {
    revalidatePath("/jobs/applications")
    await notifyInterviewResponse({
      companyUserId: result.companyUserId,
      jobId: result.jobId,
      jobTitle: result.jobTitle,
      applicationId: result.applicationId,
      accepted: input.accept,
      current,
    })
  }
  return result.ok
    ? { ok: true, status: result.status }
    : { ok: false, error: result.error }
}

/**
 * Ghi nhận lượt xem job (FR-M07-004). Best-effort — bỏ qua lỗi/dedupe trong RPC.
 * Không throw để không ảnh hưởng render trang job.
 */
export async function logJobViewAction(jobId: number): Promise<void> {
  if (!Number.isInteger(jobId) || jobId <= 0) return
  const supabase = await createClient()
  await supabase.rpc("log_job_view", { p_job_id: jobId })
}
