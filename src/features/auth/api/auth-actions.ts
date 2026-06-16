"use server"

import { getTranslations } from "next-intl/server"

import { createAdminClient } from "@/lib/supabase/admin"

import {
  createUserAndSendVerification,
  sendPasswordResetEmail,
} from "./auth-mailer"

import {
  COMPANY_SIZE_OPTIONS,
  createCompanyRegisterSchema,
  createMemberRegisterSchema,
  type CompanyRegisterInput,
  type MemberRegisterInput,
} from "../schemas"

export type CompanyRegisterResult =
  | { ok: true }
  | { ok: false; error: string; code?: string }

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function registerCompanyAction(
  input: CompanyRegisterInput,
): Promise<CompanyRegisterResult> {
  const tv = await getTranslations("auth.validation")
  const tErr = await getTranslations("auth.errors")

  const parsed = createCompanyRegisterSchema(tv).safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? tErr("registrationFailed"),
    }
  }

  if (!COMPANY_SIZE_OPTIONS.includes(parsed.data.size)) {
    return { ok: false, error: tv("sizeRequired") }
  }

  const data = parsed.data
  const admin = createAdminClient()

  const { count: taxCount, error: taxError } = await admin
    .from("company_profiles")
    .select("id", { count: "exact", head: true })
    .eq("tax_id", data.taxId)
    .is("deleted_at", null)
  if (taxError) {
    return { ok: false, error: taxError.message }
  }
  if ((taxCount ?? 0) > 0) {
    return {
      ok: false,
      code: "tax_id_already_exists",
      error: tErr("taxIdAlreadyExists"),
    }
  }

  // Tạo user + gửi email xác minh qua SMTP của Admin (không dùng email Supabase).
  const created = await createUserAndSendVerification({
    email: data.email,
    password: data.password,
    data: { role: "company", company_name: data.companyName },
  })
  if (!created.ok) {
    const dup =
      created.code === "email_exists" ||
      created.code === "user_already_exists"
    return {
      ok: false,
      code: created.code,
      error: dup ? tErr("userAlreadyExists") : tErr("registrationFailed"),
    }
  }
  const authId = created.authId

  const { data: userRow, error: userLookupError } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .maybeSingle()
  if (userLookupError || !userRow) {
    return {
      ok: false,
      error: userLookupError?.message ?? tErr("registrationFailed"),
    }
  }

  const { error: updateError } = await admin
    .from("company_profiles")
    .update({
      tax_id: data.taxId,
      industry: data.industry,
      size: data.size,
      representative_name: data.representativeName,
      representative_title: emptyToNull(data.representativeTitle),
      business_address: data.businessAddress,
      business_email: data.businessEmail,
      website: emptyToNull(data.website),
      phone: emptyToNull(data.phone),
      about: emptyToNull(data.about),
      verification_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userRow.id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await admin
    .from("users")
    .update({
      status: "pending_verification",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userRow.id)

  return { ok: true }
}

// Quên mật khẩu: gửi email đặt lại qua SMTP của Admin (không dùng email Supabase).
// LUÔN trả { ok: true } dù email tồn tại hay không để tránh dò email (enumeration).
export async function requestPasswordResetAction(input: {
  email: string
  locale?: string
}): Promise<{ ok: true }> {
  const email = (input.email ?? "").trim().toLowerCase()
  if (email && /.+@.+\..+/.test(email)) {
    await sendPasswordResetEmail(email, input.locale === "en" ? "en" : "vi")
  }
  return { ok: true }
}

// Đăng ký Cá nhân (server): tạo user + gửi email xác minh qua SMTP của Admin.
// Trigger handle_new_user tự tạo public.users + member_profile theo data.role.
export async function registerMemberAction(
  input: MemberRegisterInput,
): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
  const tv = await getTranslations("auth.validation")
  const tErr = await getTranslations("auth.errors")

  const parsed = createMemberRegisterSchema(tv).safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? tErr("registrationFailed"),
    }
  }
  const data = parsed.data

  const created = await createUserAndSendVerification({
    email: data.email,
    password: data.password,
    data: { role: "member", full_name: data.fullName },
  })
  if (!created.ok) {
    const dup =
      created.code === "email_exists" ||
      created.code === "user_already_exists"
    return {
      ok: false,
      code: created.code,
      error: dup ? tErr("userAlreadyExists") : tErr("registrationFailed"),
    }
  }
  return { ok: true }
}
