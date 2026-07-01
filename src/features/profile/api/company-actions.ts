"use server"

import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"

import {
  createCompanyProfileSchema,
  type CompanyProfileInput,
} from "../schemas"
import {
  updateCompanyMedia,
  updateCompanyProfile,
} from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function updateCompanyMediaAction(input: {
  logoUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("company")
    if (input.logoUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()

    await updateCompanyMedia(supabase, current.appUser.id, input)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.media_update",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: input,
    })
    revalidateProfile(current.appUser.id)
  })
}

export async function updateCompanyProfileAction(
  input: CompanyProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("company")
    const data = parse(createCompanyProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateCompanyProfile(supabase, current.appUser.id, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.profile_update",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: { name: data.name, industry: data.industry },
    })
    revalidateProfile(current.appUser.id)
  })
}
