"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  changePasswordSchema,
  localeSchema,
  privacySchema,
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
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const verify = await supabase.auth.signInWithPassword({
    email: current.appUser.email,
    password: parsed.data.currentPassword,
  })
  if (verify.error) {
    return fail("Mật khẩu hiện tại không chính xác")
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
  const parsed = privacySchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ")
  }

  const current = await requireCurrentUser()
  if (current.appUser.role !== "member") {
    return fail("Tùy chọn này chỉ áp dụng cho tài khoản thành viên")
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
  const current = await requireCurrentUser()
  if (current.appUser.role !== "company") {
    return fail("Tùy chọn này chỉ áp dụng cho tài khoản công ty")
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
  const parsed = localeSchema.safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Ngôn ngữ không hợp lệ")
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("users")
    .update({ locale: parsed.data.locale, updated_at: new Date().toISOString() })
    .eq("id", current.appUser.id)

  if (error) return fail(error.message)
  revalidateAll()
  return { ok: true }
}
