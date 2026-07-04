"use server"

// SRS UC Trace - M01 Tai khoan va dang nhap:
// UC-01 Dang ky tai khoan ca nhan; UC-02 Dang ky tai khoan cong ty.
// UC-07 Gui yeu cau dat lai mat khau.
// Flow: /register|/forgot-password -> auth component/hook -> auth action facade -> auth services/data.

import { getTranslations } from "next-intl/server"

import {
  createCompanyRegisterSchema,
  createMemberRegisterSchema,
  type CompanyRegisterInput,
  type MemberRegisterInput,
} from "../schemas"
import {
  registerCompany,
  registerMember,
  requestPasswordReset,
  type CompanyRegisterResult,
  type MemberRegisterResult,
} from "../services/registration.service"

export type { CompanyRegisterResult, MemberRegisterResult }

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

  return registerCompany(parsed.data, {
    registrationFailed: tErr("registrationFailed"),
    taxIdAlreadyExists: tErr("taxIdAlreadyExists"),
    userAlreadyExists: tErr("userAlreadyExists"),
  })
}

// Quên mật khẩu: gửi email đặt lại qua SMTP của Admin (không dùng email Supabase).
// LUÔN trả { ok: true } dù email tồn tại hay không để tránh dò email (enumeration).
export async function requestPasswordResetAction(input: {
  email: string
  locale?: string
}): Promise<{ ok: true }> {
  return requestPasswordReset({
    email: input.email,
    locale: input.locale === "en" ? "en" : "vi",
  })
}

// Đăng ký Cá nhân (server): tạo user + gửi email xác minh qua SMTP của Admin.
// Trigger handle_new_user tự tạo public.users + member_profile theo data.role.
export async function registerMemberAction(
  input: MemberRegisterInput,
): Promise<MemberRegisterResult> {
  const tv = await getTranslations("auth.validation")
  const tErr = await getTranslations("auth.errors")

  const parsed = createMemberRegisterSchema(tv).safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? tErr("registrationFailed"),
    }
  }
  return registerMember(parsed.data, {
    registrationFailed: tErr("registrationFailed"),
    userAlreadyExists: tErr("userAlreadyExists"),
  })
}
