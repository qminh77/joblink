"use server"

import { action, parse, requireRole } from "@/lib/action/server"
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
  registerMemberCv,
  renameOwnCv,
  setDefaultCv,
} from "../services/cv.service"
import type { MemberCv } from "../types"
import { requirePositiveId, revalidateCvs, validation } from "./shared"

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
