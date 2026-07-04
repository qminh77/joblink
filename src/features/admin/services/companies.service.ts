import "server-only"

import { COMPANY_VERIFICATION_STATUSES, type UserStatus } from "@/lib/constants"
import type { createAdminClient } from "@/lib/supabase/admin"
import type { CompanyVerification } from "@/types/database"

import { writeAuditLog } from "./audit-log.service"
import type { CompanyActionInput } from "../schemas"
import {
  countCompanyProfiles,
  getAdminCompanyTarget,
  listAdminCompanyRows,
  listCompanyUserEmails,
  updateCompanyUserStatus,
  updateCompanyVerification,
  type CompanyVerificationPatch,
} from "../data/companies.repo"
import type {
  AdminCompanyListResult,
  AdminCompanyRow,
  CompanyActionResult,
  ListCompaniesParams,
} from "../types"

type AdminSupabase = ReturnType<typeof createAdminClient>

type AdminActor = {
  appUser: { id: number }
}

type CompanyTransition = {
  status: CompanyVerification
  userStatus?: UserStatus
}

const TRANSITIONS: Record<CompanyActionInput["action"], CompanyTransition> = {
  approve: { status: "verified", userStatus: "active" },
  reject: { status: "rejected", userStatus: "pending_verification" },
  suspend: { status: "suspended" },
  restore: { status: "verified", userStatus: "active" },
}

export async function loadAdminCompanies(
  supabase: AdminSupabase,
  params: ListCompaniesParams = {},
): Promise<AdminCompanyListResult> {
  const { rows, error } = await listAdminCompanyRows(supabase, params)
  if (error) {
    return { items: [], counts: emptyCounts() }
  }

  const emails = await buildCompanyEmailMap(
    supabase,
    rows.map((row) => row.user_id),
  )
  const items: AdminCompanyRow[] = rows.map((row) => ({
    userId: row.user_id,
    email: emails[row.user_id] ?? "",
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    industry: row.industry,
    taxId: row.tax_id,
    representativeName: row.representative_name,
    businessAddress: row.business_address,
    businessEmail: row.business_email,
    website: row.website,
    verificationStatus: row.verification_status,
    verificationNote: row.verification_note,
    verifiedAt: row.verified_at,
    submittedAt: row.created_at,
  }))

  return { items, counts: await loadCompanyCounts(supabase) }
}

export async function applyCompanyVerificationAction(
  supabase: AdminSupabase,
  actor: AdminActor,
  input: CompanyActionInput,
): Promise<CompanyActionResult> {
  const { data: target } = await getAdminCompanyTarget(supabase, input.userId)
  if (!target) return { ok: false, error: "not_found" }

  const transition = TRANSITIONS[input.action]
  const { error } = await updateCompanyVerification(
    supabase,
    input.userId,
    verificationPatch(transition, actor.appUser.id, input.note ?? null),
  )
  if (error) return { ok: false, error: "update_failed" }

  if (transition.userStatus) {
    await updateCompanyUserStatus(supabase, input.userId, transition.userStatus)
  }
  if (input.action === "suspend") {
    await updateCompanyUserStatus(supabase, input.userId, "suspended")
  }

  await writeAuditLog({
    actorId: actor.appUser.id,
    action: `company.${input.action}`,
    entityType: "company_profiles",
    entityId: input.userId,
    oldData: { verification_status: target.verification_status },
    newData: { verification_status: transition.status },
    reason: input.note ?? null,
  })

  return { ok: true, status: transition.status }
}

async function buildCompanyEmailMap(
  supabase: AdminSupabase,
  userIds: number[],
) {
  const emails: Record<number, string> = {}
  const rows = await listCompanyUserEmails(supabase, userIds)
  for (const row of rows) {
    emails[row.id] = row.email
  }
  return emails
}

async function loadCompanyCounts(supabase: AdminSupabase) {
  const [allResult, ...statusResults] = await Promise.all([
    countCompanyProfiles(supabase),
    ...COMPANY_VERIFICATION_STATUSES.map((status) =>
      countCompanyProfiles(supabase, status),
    ),
  ])

  const counts: Record<string, number> = {
    pending: 0,
    pending_update: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
    all: allResult.count ?? 0,
  }
  COMPANY_VERIFICATION_STATUSES.forEach((status, index) => {
    counts[status] = statusResults[index].count ?? 0
  })

  return counts as Record<CompanyVerification | "all", number>
}

function emptyCounts() {
  return {
    pending: 0,
    pending_update: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
    all: 0,
  } as Record<CompanyVerification | "all", number>
}

function verificationPatch(
  transition: CompanyTransition,
  actorId: number,
  note: string | null,
): CompanyVerificationPatch {
  return {
    verification_status: transition.status,
    verification_note: note,
    verified_by: transition.status === "verified" ? actorId : null,
    verified_at: transition.status === "verified" ? new Date().toISOString() : null,
  }
}
