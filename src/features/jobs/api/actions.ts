"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createNotification } from "@/features/notifications/lib/create-notification"
import { createClient } from "@/lib/supabase/server"

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
  ToggleSavedResult,
  WithdrawResult,
} from "../types"

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

  const { data, error } = await supabase.rpc("create_job", {
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
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; jobId: number }
    | { ok: false; error: string }
    | null
  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  revalidatePath("/jobs")
  revalidatePath("/company/dashboard")
  return payload
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

  const { data, error } = await supabase.rpc("apply_to_job", {
    p_job_id: parsed.data.jobId,
    p_cover_letter: parsed.data.coverLetter ?? null,
    p_resume_url: parsed.data.resumeUrl ?? null,
  })

  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; applicationId: number; status: string }
    | { ok: false; error: string }
    | null
  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  revalidatePath(`/jobs/${parsed.data.jobId}`)

  // Notify recruiter (chủ job) khi có ứng viên mới.
  const { data: jobRow } = await supabase
    .from("jobs")
    .select("company_user_id, title")
    .eq("id", parsed.data.jobId)
    .maybeSingle<{ company_user_id: number; title: string }>()

  if (jobRow && jobRow.company_user_id !== current.appUser.id) {
    await createNotification({
      userId: jobRow.company_user_id,
      type: "job_application_received",
      payload: {
        type: "job_application_received",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        jobId: parsed.data.jobId,
        jobTitle: jobRow.title,
        applicationId: payload.applicationId,
      },
    })
  }

  return payload
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

  const { data, error } = await supabase.rpc("withdraw_application", {
    p_application_id: parsed.data,
  })
  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; status: string }
    | { ok: false; error: string }
    | null
  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  // Notify recruiter ứng viên đã rút đơn → dashboard cập nhật.
  const { data: appRow } = await supabase
    .from("job_applications")
    .select("job_id, jobs!inner(company_user_id, title)")
    .eq("id", parsed.data)
    .maybeSingle<{
      job_id: number
      jobs: { company_user_id: number; title: string } | null
    }>()

  if (
    appRow?.jobs &&
    appRow.jobs.company_user_id !== current.appUser.id
  ) {
    await createNotification({
      userId: appRow.jobs.company_user_id,
      type: "application_withdrawn",
      payload: {
        type: "application_withdrawn",
        userId: current.appUser.id,
        displayName: current.profile.displayName,
        avatarUrl: current.profile.avatarUrl,
        jobId: appRow.job_id,
        jobTitle: appRow.jobs.title,
        applicationId: parsed.data,
      },
    })
  }

  return payload
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

  const { data, error } = await supabase.rpc("toggle_saved_job", {
    p_job_id: parsed.data,
  })
  if (error) return { ok: false, error: error.message }

  const payload = data as unknown as
    | { ok: true; saved: boolean }
    | { ok: false; error: string }
    | null
  if (!payload) return { ok: false, error: "unknown" }
  if (!payload.ok) return payload

  revalidatePath("/saved-jobs")
  return payload
}
