import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import {
  countCompanyProfilesByTaxId,
  getAppUserIdByAuthId,
  updateCompanyRegistrationProfile,
} from "../data/auth.repo"
import type { CompanyRegisterInput, MemberRegisterInput } from "../schemas"
import {
  createUserAndSendVerification,
  sendPasswordResetEmail,
  type AuthMailLocale,
} from "./auth-mailer.service"

export type CompanyRegisterResult =
  | { ok: true }
  | { ok: false; error: string; code?: string }

export type MemberRegisterResult =
  | { ok: true; verifyRequired: boolean }
  | { ok: false; error: string; code?: string }

type RegisterMessages = {
  registrationFailed: string
  userAlreadyExists: string
}

type CompanyRegisterMessages = RegisterMessages & {
  taxIdAlreadyExists: string
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isDuplicateUserError(code: string | undefined) {
  return code === "email_exists" || code === "user_already_exists"
}

export async function registerCompany(
  data: CompanyRegisterInput,
  messages: CompanyRegisterMessages,
): Promise<CompanyRegisterResult> {
  const admin = createAdminClient()

  const { count: taxCount, error: taxError } = await countCompanyProfilesByTaxId(
    admin,
    data.taxId,
  )
  if (taxError) return { ok: false, error: taxError.message }
  if ((taxCount ?? 0) > 0) {
    return {
      ok: false,
      code: "tax_id_already_exists",
      error: messages.taxIdAlreadyExists,
    }
  }

  const created = await createUserAndSendVerification({
    email: data.email,
    password: data.password,
    data: { role: "company", company_name: data.companyName },
  })
  if (!created.ok) {
    return {
      ok: false,
      code: created.code,
      error: isDuplicateUserError(created.code)
        ? messages.userAlreadyExists
        : messages.registrationFailed,
    }
  }

  const { data: userRow, error: userLookupError } = await getAppUserIdByAuthId(
    admin,
    created.authId,
  )
  if (userLookupError || !userRow) {
    return {
      ok: false,
      error: userLookupError?.message ?? messages.registrationFailed,
    }
  }

  const { error: updateError } = await updateCompanyRegistrationProfile(
    admin,
    userRow.id,
    {
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
    },
  )

  if (updateError) return { ok: false, error: updateError.message }
  return { ok: true }
}

export async function registerMember(
  data: MemberRegisterInput,
  messages: RegisterMessages,
): Promise<MemberRegisterResult> {
  const created = await createUserAndSendVerification({
    email: data.email,
    password: data.password,
    data: { role: "member", full_name: data.fullName },
  })

  if (!created.ok) {
    return {
      ok: false,
      code: created.code,
      error: isDuplicateUserError(created.code)
        ? messages.userAlreadyExists
        : messages.registrationFailed,
    }
  }

  return { ok: true, verifyRequired: created.verifyRequired }
}

export async function requestPasswordReset(input: {
  email: string
  locale?: AuthMailLocale
}): Promise<{ ok: true }> {
  const email = (input.email ?? "").trim().toLowerCase()
  if (email && /.+@.+\..+/.test(email)) {
    await sendPasswordResetEmail(email, input.locale ?? "vi")
  }
  return { ok: true }
}
