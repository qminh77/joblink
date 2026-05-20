"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  createChangePasswordSchema,
  createLocaleSchema,
  createPrivacySchema,
  type ChangePasswordInput,
  type LocaleInput,
  type PrivacyInput,
} from "../schemas"

type ActionResult = { ok: true } | { ok: false; error: string }

function fail(error: string): ActionResult {
  return { ok: false, error }
}

function revalidateAll() {
  revalidatePath("/settings")
  revalidatePath("/profile/edit")
  revalidatePath("/home")
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const tv = await getTranslations("settings.validation")
  const tp = await getTranslations("settings.password")

  const parsed = createChangePasswordSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tv("currentPasswordRequired"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const verify = await supabase.auth.signInWithPassword({
    email: current.appUser.email,
    password: parsed.data.currentPassword,
  })
  if (verify.error) {
    return fail(tp("wrongCurrent"))
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (error) return fail(error.message)

  return { ok: true }
}

export async function updatePrivacyAction(
  input: PrivacyInput,
): Promise<ActionResult> {
  const te = await getTranslations("settings.errors")
  const tp = await getTranslations("profile.errors")

  const parsed = createPrivacySchema().safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tp("invalidData"))
  }

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail(te("privacyMemberOnly"))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("member_profiles")
    .update({
      profile_visibility: parsed.data.profileVisibility,
      open_to_work: parsed.data.openToWork,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateAll()
  return { ok: true }
}

export async function updateCompanyOpenToHireAction(
  openToHire: boolean,
): Promise<ActionResult> {
  const te = await getTranslations("settings.errors")

  const current = await requireCurrentUser()
  if (current.appUser.role !== "company") {
    return fail(te("openToHireCompanyOnly"))
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("company_profiles")
    .update({
      open_to_hire: openToHire,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateAll()
  return { ok: true }
}

export async function updateLocaleAction(
  input: LocaleInput,
): Promise<ActionResult> {
  const tv = await getTranslations("settings.validation")
  const tp = await getTranslations("profile.errors")

  const parsed = createLocaleSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tp("invalidData"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("users")
    .update({ locale: parsed.data.locale, updated_at: new Date().toISOString() })
    .eq("id", current.appUser.id)

  if (error) return fail(error.message)

  // Đồng bộ cookie để request kế tiếp dùng locale mới ngay
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("NEXT_LOCALE", parsed.data.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  } catch {
    // ignore
  }

  revalidateAll()
  return { ok: true }
}
