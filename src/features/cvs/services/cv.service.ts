import "server-only"

import type { createClient } from "@/lib/supabase/server"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import type { CurrentUser } from "@/features/auth/types"
import type { Json } from "@/types/database"

import {
  countActiveCvs,
  findApplicationResumeForCompany,
  findMemberCv,
  insertMemberCv,
  listMemberEducationsForCvBuilder,
  listMemberExperiencesForCvBuilder,
  listMemberSkillsForCvBuilder,
  loadMemberProfileForCvBuilder,
  listOwnCvSummaries,
  renameMemberCv,
  setDefaultMemberCvRpc,
  softDeleteMemberCv,
  unsetDefaultMemberCvs,
} from "../data/cvs.repo"
import type { RegisterCvInput, RenameCvInput } from "../schemas"
import {
  mapMemberCv,
  type ApplicantResumeUrl,
  type CvBuilderProfile,
  type MemberCv,
  type MemberCvRow,
  type OwnCvSummary,
} from "../types"
import {
  createAdminCvSignedUrl,
  createCvSignedUrl,
  removeCvStorageObject,
} from "./cv-storage.service"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function loadCvBuilderProfile(
  supabase: Supabase,
  current: CurrentUser,
): Promise<CvBuilderProfile> {
  const [profileRes, expRes, eduRes, skillRes] = await Promise.all([
    loadMemberProfileForCvBuilder(supabase, current.appUser.id),
    listMemberExperiencesForCvBuilder(supabase, current.appUser.id),
    listMemberEducationsForCvBuilder(supabase, current.appUser.id),
    listMemberSkillsForCvBuilder(supabase, current.appUser.id),
  ])

  if (!profileRes.data) throw ActionError.key("notFound")

  return {
    fullName: profileRes.data.full_name,
    email: current.appUser.email ?? "",
    phone: current.appUser.phone,
    headline: profileRes.data.headline,
    experiences: (expRes.data ?? []).map((e) => ({
      id: e.id,
      companyName: e.company_name,
      position: e.position,
      startDate: e.start_date,
      endDate: e.end_date,
      isCurrent: e.is_current,
      description: e.description,
    })),
    educations: (eduRes.data ?? []).map((e) => ({
      id: e.id,
      schoolName: e.school_name,
      degree: e.degree,
      fieldOfStudy: e.field_of_study,
      startDate: e.start_date,
      endDate: e.end_date,
      description: e.description,
    })),
    skills: (skillRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
    })),
  }
}

export async function registerMemberCv(
  supabase: Supabase,
  current: CurrentUser,
  data: RegisterCvInput,
): Promise<MemberCv> {
  const pathOwner = data.storagePath.split("/")[0]
  if (pathOwner !== String(current.appUser.id)) {
    throw ActionError.key("invalidStoragePath")
  }

  const activeCount = await countActiveCvs(supabase, current.appUser.id)
  const isDefault = data.makeDefault ?? activeCount === 0

  if (isDefault && activeCount > 0) {
    assertOk(
      await unsetDefaultMemberCvs(supabase, current.appUser.id),
      "unexpected",
    )
  }

  const row = unwrap(
    await insertMemberCv(supabase, {
      userId: current.appUser.id,
      fileName: data.fileName,
      storagePath: data.storagePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      source: data.source,
      builderConfig: (data.builderConfig ?? null) as Json | null,
      isDefault,
    }),
    "unexpected",
  )

  return mapMemberCv(row as MemberCvRow)
}

export async function renameOwnCv(
  supabase: Supabase,
  current: CurrentUser,
  data: RenameCvInput,
): Promise<void> {
  assertOk(
    await renameMemberCv(supabase, data.id, current.appUser.id, data.fileName),
    "unexpected",
  )
}

export async function deleteOwnCv(
  supabase: Supabase,
  current: CurrentUser,
  cvId: number,
): Promise<void> {
  const { data: cv } = await findMemberCv(supabase, cvId, current.appUser.id)
  if (!cv) throw ActionError.key("notFound")

  assertOk(
    await softDeleteMemberCv(supabase, cvId, current.appUser.id),
    "unexpected",
  )

  const { error } = await removeCvStorageObject(cv.storage_path)
  if (error) {
    console.error("[deleteCvAction] storage remove failed", error)
  }
}

export async function setDefaultCv(
  supabase: Supabase,
  cvId: number,
): Promise<void> {
  const { data, error } = await setDefaultMemberCvRpc(supabase, cvId)
  if (error) {
    console.error("[setDefaultCvAction] rpc error", error)
    throw ActionError.key("unexpected")
  }
  const result = data as { ok: boolean; error?: string } | null
  if (!result?.ok) {
    throw ActionError.key(result?.error ?? "unexpected")
  }
}

export async function getOwnCvViewUrl(
  supabase: Supabase,
  current: CurrentUser,
  cvId: number,
): Promise<{ url: string }> {
  const { data: cv } = await findMemberCv(supabase, cvId, current.appUser.id)
  if (!cv) throw ActionError.key("notFound")

  const signed = await createCvSignedUrl(supabase, cv.storage_path)
  if (!signed.data) {
    console.error("[getCvViewUrl]", signed.error)
    throw ActionError.key("unexpected")
  }
  return { url: signed.data }
}

export async function loadOwnCvSummaries(
  supabase: Supabase,
  current: CurrentUser,
): Promise<OwnCvSummary[]> {
  const { data } = await listOwnCvSummaries(supabase, current.appUser.id)
  return ((data ?? []) as Array<{
    id: number
    file_name: string
    file_size: number
    is_default: boolean
  }>).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileSize: row.file_size,
    isDefault: row.is_default,
  }))
}

export async function getApplicantResumeUrl(
  supabase: Supabase,
  current: CurrentUser,
  applicationId: number,
): Promise<ApplicantResumeUrl> {
  const { data, error } = await findApplicationResumeForCompany(
    supabase,
    applicationId,
  )
  if (error) {
    console.error("[getApplicantResumeUrl] db", error)
    throw ActionError.key("unexpected")
  }
  if (!data || data.jobs?.company_user_id !== current.appUser.id) {
    throw ActionError.key("forbidden")
  }

  const raw = data.resume_url?.trim() ?? ""
  if (!raw) throw ActionError.key("notFound")

  if (/^https?:\/\//i.test(raw)) {
    return { url: raw, kind: "external" }
  }

  const signed = await createCvSignedUrl(supabase, raw)
  if (signed.data) {
    return { url: signed.data, kind: "signed" }
  }

  const adminSigned = await createAdminCvSignedUrl(raw)
  if (!adminSigned.data) {
    console.error("[getApplicantResumeUrl] sign", signed.error, adminSigned.error)
    throw ActionError.key("unexpected")
  }
  return { url: adminSigned.data, kind: "signed" }
}
