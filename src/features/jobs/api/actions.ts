"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import { createClient } from "@/lib/supabase/server"

import {
  createApplicationIdSchema,
  createApplySchema,
  createJobIdSchema,
  createJobSchema,
  updateJobSchema,
} from "../schemas"
import {
  applyToJob,
  createJob,
  logJobView,
  toggleSavedJob,
  updateJob,
  withdrawApplication,
} from "../services/jobs.service"
import { ensureCompanyCanManageJobs } from "../services/job-management-policy"
import type {
  ApplyResult,
  CreateJobInput,
  CreateJobResult,
  ToggleSavedResult,
  UpdateJobInput,
  UpdateJobResult,
  WithdrawResult,
} from "../types"

type JobTranslator = Awaited<ReturnType<typeof getTranslations>>

function validationError(te: JobTranslator, message?: string) {
  return { ok: false as const, error: message ?? te("unknown") }
}

function ensureMemberApplicant(current: CurrentUser, te: JobTranslator) {
  return current.appUser.role === "member"
    ? null
    : validationError(te, te("memberOnly"))
}

export async function createJobAction(
  input: CreateJobInput,
): Promise<CreateJobResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createJobSchema(te).safeParse(input)
  if (!parsed.success) {
    return validationError(te, parsed.error.issues[0]?.message)
  }

  const current = await requireCurrentUser()
  const companyGate = ensureCompanyCanManageJobs(current, te)
  if (companyGate) return companyGate
  await checkRateLimit(current.appUser.id, "job", 5, 60) // 5 creates / 60s
  const supabase = await createClient()
  const result = await createJob(supabase, parsed.data)

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "job.create",
      entityType: "jobs",
      entityId: result.jobId,
      newData: { title: parsed.data.title },
    })
    revalidatePath("/jobs")
  }
  return result
}

export async function updateJobAction(
  input: UpdateJobInput,
): Promise<UpdateJobResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = updateJobSchema(te).safeParse(input)
  if (!parsed.success) {
    return validationError(te, parsed.error.issues[0]?.message)
  }

  const current = await requireCurrentUser()
  const companyGate = ensureCompanyCanManageJobs(current, te)
  if (companyGate) return companyGate
  await checkRateLimit(current.appUser.id, "job", 10, 60) // 10 updates / 60s
  const supabase = await createClient()
  const result = await updateJob(supabase, parsed.data)

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "job.update",
      entityType: "jobs",
      entityId: parsed.data.jobId,
      newData: { title: parsed.data.title },
    })
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${parsed.data.jobId}`)
  }
  return result
}

export async function applyToJobAction(input: {
  jobId: number
  coverLetter?: string | null
  resumeCvId: number
}): Promise<ApplyResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createApplySchema(te).safeParse(input)
  if (!parsed.success) {
    return validationError(te, parsed.error.issues[0]?.message)
  }

  const current = await requireCurrentUser()
  const memberGate = ensureMemberApplicant(current, te)
  if (memberGate) return memberGate
  await checkRateLimit(current.appUser.id, "application", 5, 60) // 5 applications / 60s
  const supabase = await createClient()
  const result = await applyToJob(
    supabase,
    current,
    parsed.data,
    te("resumeRequired"),
  )

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "job.apply",
      entityType: "job_applications",
      entityId: parsed.data.jobId,
      newData: { jobId: parsed.data.jobId },
    })
    revalidatePath(`/jobs/${parsed.data.jobId}`)
  }
  return result
}

export async function withdrawApplicationAction(
  applicationId: number,
): Promise<WithdrawResult> {
  const te = await getTranslations("jobs.errors")
  const parsed = createApplicationIdSchema(te).safeParse(applicationId)
  if (!parsed.success) {
    return validationError(te, parsed.error.issues[0]?.message)
  }

  const current = await requireCurrentUser()
  const memberGate = ensureMemberApplicant(current, te)
  if (memberGate) return memberGate
  const supabase = await createClient()
  const result = await withdrawApplication(supabase, current, parsed.data)

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "job.withdraw_application",
      entityType: "job_applications",
      entityId: parsed.data,
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
    return validationError(te, parsed.error.issues[0]?.message)
  }

  const current = await requireCurrentUser()
  const memberGate = ensureMemberApplicant(current, te)
  if (memberGate) return memberGate
  const supabase = await createClient()
  const result = await toggleSavedJob(supabase, parsed.data)

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.saved ? "job.save" : "job.unsave",
      entityType: "saved_jobs",
      entityId: parsed.data,
    })
    revalidatePath("/saved-jobs")
  }
  return result
}

export async function logJobViewAction(jobId: number): Promise<void> {
  if (!Number.isInteger(jobId) || jobId <= 0) return
  const supabase = await createClient()
  await logJobView(supabase, jobId)
}
