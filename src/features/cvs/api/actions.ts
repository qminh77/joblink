"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { ActionError, action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"

import {
  createRegisterCvSchema,
  createRenameCvSchema,
  type RegisterCvInput,
  type RenameCvInput,
} from "../schemas"
import {
  deleteOwnCv,
  getApplicantResumeUrl,
  getOwnCvViewUrl,
  loadCvBuilderProfile,
  loadOwnCvSummaries,
  registerMemberCv,
  renameOwnCv,
  setDefaultCv,
} from "../services/cv.service"
import type {
  ApplicantResumeUrl,
  CvBuilderProfile,
  MemberCv,
  OwnCvSummary,
} from "../types"

const validation = () => getTranslations("cvs.validation")

function revalidateCvs() {
  revalidatePath("/profile/edit")
  revalidatePath("/jobs", "layout")
}

function requirePositiveId(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw ActionError.key("invalidId")
  }
  return value
}

// Load profile data (experiences, educations, skills) cho CV Builder dialog.
export async function getProfileForCvBuilderAction(): Promise<
  ActionResult<CvBuilderProfile>
> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const supabase = await createClient()
    return loadCvBuilderProfile(supabase, current)
  })
}

// Sau khi client upload file PDF vào bucket `cv/<userId>/<uuid>.pdf` thành công,
// action chỉ validate/auth rồi giao orchestration cho service.
export async function registerCvAction(
  input: RegisterCvInput,
): Promise<ActionResult<MemberCv>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createRegisterCvSchema(await validation()), input)
    const supabase = await createClient()
    const cv = await registerMemberCv(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "cv.register",
      entityType: "member_cvs",
      entityId: cv.id,
      newData: { fileName: data.fileName },
    })
    revalidateCvs()
    return cv
  })
}

export async function renameCvAction(
  input: RenameCvInput,
): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createRenameCvSchema(await validation()), input)
    const supabase = await createClient()
    await renameOwnCv(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "cv.rename",
      entityType: "member_cvs",
      entityId: data.id,
      newData: { fileName: data.fileName },
    })
    revalidateCvs()
  })
}

export async function deleteCvAction(cvId: number): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const id = requirePositiveId(cvId)
    const supabase = await createClient()
    await deleteOwnCv(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "cv.delete",
      entityType: "member_cvs",
      entityId: id,
    })
    revalidateCvs()
  })
}

export async function setDefaultCvAction(cvId: number): Promise<ActionResult> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const id = requirePositiveId(cvId)
    const supabase = await createClient()
    await setDefaultCv(supabase, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "cv.set_default",
      entityType: "member_cvs",
      entityId: id,
    })
    revalidateCvs()
  })
}

// Bucket `cvs` private: mọi lượt xem đều đi qua signed URL ngắn hạn.
export async function getCvViewUrlAction(input: {
  cvId?: number
  storagePath?: string
}): Promise<ActionResult<{ url: string }>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const id = requirePositiveId(input.cvId)
    const supabase = await createClient()
    return getOwnCvViewUrl(supabase, current, id)
  })
}

// Dùng cho UI client cần load CVs động (vd: Easy Apply dialog).
export async function loadOwnCvsAction(): Promise<
  ActionResult<OwnCvSummary[]>
> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const supabase = await createClient()
    return loadOwnCvSummaries(supabase, current)
  })
}

// Company xem CV ứng viên: service verify ownership rồi trả signed/external URL.
export async function getApplicantResumeUrlAction(input: {
  applicationId: number
}): Promise<ActionResult<ApplicantResumeUrl>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("company")
    const applicationId = requirePositiveId(input.applicationId)
    const supabase = await createClient()
    return getApplicantResumeUrl(supabase, current, applicationId)
  })
}
