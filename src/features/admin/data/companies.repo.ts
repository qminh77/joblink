import "server-only"

import type { UserStatus } from "@/features/auth/lib/constants"
import type { createAdminClient } from "@/lib/supabase/admin"
import type { CompanyVerification } from "@/types/database"

import type { ListCompaniesParams } from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

export type AdminCompanyRecord = {
  user_id: number
  name: string
  slug: string
  logo_url: string | null
  industry: string | null
  tax_id: string | null
  representative_name: string | null
  business_address: string | null
  business_email: string | null
  website: string | null
  verification_status: CompanyVerification
  verification_note: string | null
  verified_at: string | null
  created_at: string
}

export type CompanyUserEmailRecord = {
  id: number
  email: string
}

export type AdminCompanyTargetRecord = {
  user_id: number
  verification_status: CompanyVerification
}

export type CompanyVerificationPatch = {
  verification_status: CompanyVerification
  verification_note: string | null
  verified_by: number | null
  verified_at: string | null
}

export async function listAdminCompanyRows(
  supabase: AdminSupabase,
  params: ListCompaniesParams,
) {
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("company_profiles")
    .select(
      "user_id, name, slug, logo_url, industry, tax_id, representative_name, business_address, business_email, website, verification_status, verification_note, verified_at, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (params.status && params.status !== "all") {
    query = query.eq("verification_status", params.status)
  }
  if (params.search?.trim()) {
    query = query.ilike("name", `%${params.search.trim()}%`)
  }

  const { data, error } = await query
  return { rows: (data ?? []) as AdminCompanyRecord[], error }
}

export async function listCompanyUserEmails(
  supabase: AdminSupabase,
  userIds: number[],
) {
  if (userIds.length === 0) return [] as CompanyUserEmailRecord[]

  const { data } = await supabase
    .from("users")
    .select("id, email")
    .in("id", userIds)
  return (data ?? []) as CompanyUserEmailRecord[]
}

export function countCompanyProfiles(
  supabase: AdminSupabase,
  status?: CompanyVerification,
) {
  let query = supabase
    .from("company_profiles")
    .select("user_id", { count: "exact", head: true })
    .is("deleted_at", null)
  if (status) query = query.eq("verification_status", status)
  return query
}

export function getAdminCompanyTarget(
  supabase: AdminSupabase,
  userId: number,
) {
  return supabase
    .from("company_profiles")
    .select("user_id, verification_status")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<AdminCompanyTargetRecord>()
}

export function updateCompanyVerification(
  supabase: AdminSupabase,
  userId: number,
  patch: CompanyVerificationPatch,
) {
  return supabase
    .from("company_profiles")
    .update(patch as never)
    .eq("user_id", userId)
}

export function updateCompanyUserStatus(
  supabase: AdminSupabase,
  userId: number,
  status: UserStatus,
) {
  return supabase.from("users").update({ status }).eq("id", userId)
}
