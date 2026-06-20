"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdmin } from "./admin-guard"
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
  await requireAdmin()
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

  const current = await requireAdmin()
  const supabase = createAdminClient()
  const result = await applyCompanyVerificationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminCompanyViews()
  return result
}

function revalidateAdminCompanyViews() {
  revalidatePath("/admin/companies")
  revalidatePath("/admin/audit-log")
  revalidatePath("/admin/dashboard")
}
