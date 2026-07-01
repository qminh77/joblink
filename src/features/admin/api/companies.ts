"use server"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminPermission } from "./admin-guard"
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
  await requireAdminPermission("companies.view")
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

  const current = await requireAdminPermission("companies.moderate")
  const supabase = createAdminClient()
  const result = await applyCompanyVerificationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("companies")
  return result
}
