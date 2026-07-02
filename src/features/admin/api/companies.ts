"use server"

// SRS UC Trace - M09 UC-63 Quan ly xac minh va trang thai cong ty.
// Flow: /admin/companies -> companies panel -> admin company API -> companies service/repo -> audit + revalidate.

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
import { revalidateAdminSection } from "./revalidation"
import { companyActionSchema, type CompanyActionInput } from "../schemas"
import {
  applyCompanyVerificationAction,
  loadAdminCompanies,
} from "../services/companies.service"
import type {
  AdminCompanyListResult,
  CompanyActionResult,
  ListCompaniesParams,
} from "../types"

export type {
  AdminCompanyListResult,
  CompanyActionResult,
  ListCompaniesParams,
} from "../types"

export async function listAdminCompanies(
  params: ListCompaniesParams = {},
): Promise<AdminCompanyListResult> {
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAdminCompanies(supabase, params)
}

export async function applyCompanyAction(
  input: CompanyActionInput,
): Promise<CompanyActionResult> {
  const parsed = companyActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  if (parsed.data.action === "reject" && !parsed.data.note?.trim()) {
    return { ok: false, error: "reason_required" }
  }

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
  const result = await applyCompanyVerificationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("companies")
  return result
}
