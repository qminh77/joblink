import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { rpcResult } from "@/lib/action/rpc"
import type { createClient } from "@/lib/supabase/server"

import { getApplicantCvForApplication } from "../data/jobs.repo"
import type {
  ApplyResult,
  CreateJobInput,
  CreateJobResult,
  ToggleSavedResult,
  UpdateJobInput,
  UpdateJobResult,
  WithdrawResult,
} from "../types"
import {
  notifyApplicationReceived,
  notifyApplicationWithdrawn,
} from "./application-notifications"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type ApplyToJobInput = {
  jobId: number
  coverLetter?: string | null
  resumeCvId: number
}

export function createJob(
  supabase: Supabase,
  input: CreateJobInput,
): Promise<CreateJobResult> {
  return rpcResult<{ jobId: number }>(
    supabase.rpc("create_job", {
      p_title: input.title,
      p_description: input.description,
      p_requirements: input.requirements ?? null,
      p_province_id: input.provinceId ?? null,
      p_ward_id: input.wardId ?? null,
      p_salary_min: input.salaryMin ?? null,
      p_salary_max: input.salaryMax ?? null,
      p_salary_visible: input.salaryVisible ?? true,
      p_job_type_id: input.jobTypeId,
      p_work_mode_id: input.workModeId,
      p_job_position_id: null,
      p_position_title: input.positionTitle ?? null,
      p_status: input.status,
      p_expires_at: input.expiresAt ?? null,
      p_skills: input.skills ?? null,
    }),
  )
}

export function updateJob(
  supabase: Supabase,
  input: UpdateJobInput,
): Promise<UpdateJobResult> {
  return rpcResult<{ jobId: number }>(
    supabase.rpc("update_job", {
      p_job_id: input.jobId,
      p_title: input.title,
      p_description: input.description,
      p_requirements: input.requirements ?? null,
      p_province_id: input.provinceId ?? null,
      p_ward_id: input.wardId ?? null,
      p_salary_min: input.salaryMin ?? null,
      p_salary_max: input.salaryMax ?? null,
      p_salary_visible: input.salaryVisible ?? true,
      p_job_type_id: input.jobTypeId,
      p_work_mode_id: input.workModeId,
      p_position_title: input.positionTitle ?? null,
      p_expires_at: input.expiresAt ?? null,
      p_skills: input.skills ?? null,
    }),
  )
}

export async function applyToJob(
  supabase: Supabase,
  current: CurrentUser,
  input: ApplyToJobInput,
  resumeRequiredError: string,
): Promise<ApplyResult> {
  const { data: cv, error: cvError } = await getApplicantCvForApplication(
    supabase,
    input.resumeCvId,
    current.appUser.id,
  )
  if (cvError || !cv) {
    return { ok: false, error: resumeRequiredError }
  }

  const result = await rpcResult<{ applicationId: number; status: string }>(
    supabase.rpc("apply_to_job", {
      p_job_id: input.jobId,
      p_cover_letter: input.coverLetter ?? null,
      p_resume_url: cv.storage_path,
    }),
  )

  if (result.ok) {
    await notifyApplicationReceived({
      supabase,
      jobId: input.jobId,
      applicationId: result.applicationId,
      current,
    })
  }

  return result
}

export async function withdrawApplication(
  supabase: Supabase,
  current: CurrentUser,
  applicationId: number,
): Promise<WithdrawResult> {
  const result = await rpcResult<{ status: string }>(
    supabase.rpc("withdraw_application", { p_application_id: applicationId }),
  )

  if (result.ok) {
    await notifyApplicationWithdrawn({
      supabase,
      applicationId,
      current,
    })
  }

  return result
}

export function toggleSavedJob(
  supabase: Supabase,
  jobId: number,
): Promise<ToggleSavedResult> {
  return rpcResult<{ saved: boolean }>(
    supabase.rpc("toggle_saved_job", { p_job_id: jobId }),
  )
}

export async function logJobView(supabase: Supabase, jobId: number) {
  await supabase.rpc("log_job_view", { p_job_id: jobId })
}
