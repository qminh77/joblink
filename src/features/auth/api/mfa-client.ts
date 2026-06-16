"use client"

import { createClient } from "@/lib/supabase/client"

// UC-09/10: 2FA bằng TOTP (tương thích Google Authenticator) qua Supabase MFA.
// Gói toàn bộ lời gọi supabase.auth.mfa.* ở đây để component không rải rác.

export type EnrolledTotp = {
  factorId: string
  qrCode: string
  secret: string
  uri: string
}

export async function listVerifiedTotpFactors() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return (data.totp ?? []).filter((f) => f.status === "verified")
}

export async function listAllTotpFactors() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp ?? []
}

export async function enrollTotp(): Promise<EnrolledTotp> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
  if (error) throw error
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

// Xác minh mã 6 số: tạo challenge rồi verify. Dùng cho cả lúc bật 2FA và lúc
// đăng nhập (step-up AAL2).
export async function challengeAndVerify(factorId: string, code: string) {
  const supabase = createClient()
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error) throw challenge.error
  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  })
  if (verify.error) throw verify.error
  return verify.data
}

export async function unenrollFactor(factorId: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function getAssuranceLevel() {
  const supabase = createClient()
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return data
}
