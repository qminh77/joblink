import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"
import type { createClient } from "@/lib/supabase/server"
import type { AppUserRow, CompanyVerification } from "@/types/database"

type AdminSupabase = ReturnType<typeof createAdminClient>
type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export type MemberProfileSummaryRecord = {
  full_name: string
  avatar_url: string | null
  cover_url: string | null
  headline: string | null
}

export type CompanyProfileSummaryRecord = {
  name: string
  logo_url: string | null
  cover_url: string | null
  industry: string | null
  verification_status: CompanyVerification
}

export type CompanyRegistrationProfilePatch = {
  tax_id: string
  industry: string
  size: string
  representative_name: string
  representative_title: string | null
  business_address: string
  business_email: string
  website: string | null
  phone: string | null
  about: string | null
  verification_status: "pending"
  updated_at: string
}

export function getAppUserByAuthId(
  supabase: ServerSupabase,
  authId: string,
) {
  return supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .maybeSingle<AppUserRow>()
}

export function getMemberProfileSummary(
  supabase: ServerSupabase,
  userId: number,
) {
  return supabase
    .from("member_profiles")
    .select("full_name, avatar_url, cover_url, headline")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<MemberProfileSummaryRecord>()
}

export function getCompanyProfileSummary(
  supabase: ServerSupabase,
  userId: number,
) {
  return supabase
    .from("company_profiles")
    .select("name, logo_url, cover_url, industry, verification_status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<CompanyProfileSummaryRecord>()
}

export function countCompanyProfilesByTaxId(
  supabase: AdminSupabase,
  taxId: string,
) {
  return supabase
    .from("company_profiles")
    .select("id", { count: "exact", head: true })
    .eq("tax_id", taxId)
    .is("deleted_at", null)
}

export function getAppUserIdByAuthId(
  supabase: AdminSupabase,
  authId: string,
) {
  return supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .maybeSingle<{ id: number }>()
}

export function updateCompanyRegistrationProfile(
  supabase: AdminSupabase,
  userId: number,
  patch: CompanyRegistrationProfilePatch,
) {
  return supabase
    .from("company_profiles")
    .update(patch as never)
    .eq("user_id", userId)
}

export function getRequireEmailVerificationSetting(supabase: AdminSupabase) {
  return supabase
    .from("system_settings")
    .select("value")
    .eq("setting_key", "require_email_verification")
    .maybeSingle<{ value: unknown }>()
}
