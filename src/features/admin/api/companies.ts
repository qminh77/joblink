"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { COMPANY_VERIFICATION_STATUSES } from "@/lib/constants"
import type { CompanyVerification } from "@/types/database"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import { companyActionSchema, type CompanyActionInput } from "../schemas"
import type { AdminCompanyRow } from "../types"

export type ListCompaniesParams = {
  status?: CompanyVerification | "all"
  search?: string
  limit?: number
}

export async function listAdminCompanies(
  params: ListCompaniesParams = {},
): Promise<{
  items: AdminCompanyRow[]
  counts: Record<CompanyVerification | "all", number>
}> {
  await requireAdmin()
  const supabase = createAdminClient()
  const limit = Math.min(200, Math.max(10, params.limit ?? 100))

  let query = supabase
    .from("company_profiles")
    .select(
      "user_id, name, slug, logo_url, industry, tax_id, representative_name, business_address, business_email, website, verification_status, verification_note, verified_at, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (
    params.status &&
    params.status !== "all"
  ) {
    query = query.eq("verification_status", params.status)
  }
  if (params.search?.trim()) {
    query = query.ilike("name", `%${params.search.trim()}%`)
  }

  const { data } = await query

  type Row = {
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

  const rows = (data ?? []) as Row[]
  const userIds = rows.map((r) => r.user_id)
  const emails: Record<number, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds)
    for (const u of (users ?? []) as Array<{ id: number; email: string }>) {
      emails[u.id] = u.email
    }
  }

  const items: AdminCompanyRow[] = rows.map((r) => ({
    userId: r.user_id,
    email: emails[r.user_id] ?? "",
    name: r.name,
    slug: r.slug,
    logoUrl: r.logo_url,
    industry: r.industry,
    taxId: r.tax_id,
    representativeName: r.representative_name,
    businessAddress: r.business_address,
    businessEmail: r.business_email,
    website: r.website,
    verificationStatus: r.verification_status,
    verificationNote: r.verification_note,
    verifiedAt: r.verified_at,
    submittedAt: r.created_at,
  }))

  // Đếm bằng count head:true song song (không tải dữ liệu) thay vì select toàn bảng.
  const countCol = (status?: CompanyVerification) => {
    let q = supabase
      .from("company_profiles")
      .select("user_id", { count: "exact", head: true })
      .is("deleted_at", null)
    if (status) q = q.eq("verification_status", status)
    return q
  }
  const [allRes, ...statusRes] = await Promise.all([
    countCol(),
    ...COMPANY_VERIFICATION_STATUSES.map((s) => countCol(s)),
  ])

  const counts: Record<string, number> = {
    pending: 0,
    pending_update: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
    all: allRes.count ?? 0,
  }
  COMPANY_VERIFICATION_STATUSES.forEach((s, i) => {
    counts[s] = statusRes[i].count ?? 0
  })

  return {
    items,
    counts: counts as Record<CompanyVerification | "all", number>,
  }
}

export type CompanyActionResult =
  | { ok: true; status: CompanyVerification }
  | { ok: false; error: string }

const TRANSITIONS: Record<
  CompanyActionInput["action"],
  { status: CompanyVerification; userStatus?: "active" | "pending_verification" }
> = {
  approve: { status: "verified", userStatus: "active" },
  reject: { status: "rejected", userStatus: "pending_verification" },
  suspend: { status: "suspended" },
  restore: { status: "verified", userStatus: "active" },
}

export async function applyCompanyAction(
  input: CompanyActionInput,
): Promise<CompanyActionResult> {
  const parsed = companyActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  if (
    parsed.data.action === "reject" &&
    !parsed.data.note?.trim()
  ) {
    return { ok: false, error: "reason_required" }
  }

  const current = await requireAdmin()
  const supabase = createAdminClient()

  const { data: target } = await supabase
    .from("company_profiles")
    .select("user_id, verification_status")
    .eq("user_id", parsed.data.userId)
    .is("deleted_at", null)
    .maybeSingle<{ user_id: number; verification_status: CompanyVerification }>()
  if (!target) return { ok: false, error: "not_found" }

  const transition = TRANSITIONS[parsed.data.action]

  const updatePayload = {
    verification_status: transition.status,
    verification_note: parsed.data.note ?? null,
    verified_by:
      transition.status === "verified" ? current.appUser.id : null,
    verified_at:
      transition.status === "verified" ? new Date().toISOString() : null,
  } as const

  const { error: compErr } = await supabase
    .from("company_profiles")
    .update(updatePayload as never)
    .eq("user_id", parsed.data.userId)
  if (compErr) return { ok: false, error: "update_failed" }

  if (transition.userStatus) {
    await supabase
      .from("users")
      .update({ status: transition.userStatus })
      .eq("id", parsed.data.userId)
  }
  if (parsed.data.action === "suspend") {
    await supabase
      .from("users")
      .update({ status: "suspended" })
      .eq("id", parsed.data.userId)
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: `company.${parsed.data.action}`,
    entityType: "company_profiles",
    entityId: parsed.data.userId,
    oldData: { verification_status: target.verification_status },
    newData: { verification_status: transition.status },
    reason: parsed.data.note ?? null,
  })

  revalidatePath("/admin/companies")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
  return { ok: true, status: transition.status }
}
