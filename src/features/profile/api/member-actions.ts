"use server"

import { getTranslations } from "next-intl/server"

import { action, parse, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"

import {
  createMemberProfileSchema,
  type MemberProfileInput,
} from "../schemas"
import {
  updateMemberMedia,
  updateMemberProfile,
} from "../services/profile.service"
import { revalidateProfile } from "./revalidation"

const validation = () => getTranslations("profile.validation")

export async function updateMemberProfileAction(
  input: MemberProfileInput,
): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    const data = parse(createMemberProfileSchema(await validation()), input)
    const supabase = await createClient()

    await updateMemberProfile(supabase, current.appUser.id, data)
    revalidateProfile(current.appUser.id)
  })
}

export async function updateMemberMediaAction(input: {
  avatarUrl?: string | null
  coverUrl?: string | null
}): Promise<ActionResult> {
  return action("profile.errors", async () => {
    const current = await requireRole("member")
    if (input.avatarUrl === undefined && input.coverUrl === undefined) return
    const supabase = await createClient()

    await updateMemberMedia(supabase, current.appUser.id, input)
    revalidateProfile(current.appUser.id)
  })
}
