"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { rpcResult } from "@/lib/action/rpc"

import {
  createApplicationStatusUpdateSchema,
  createCompanyUserIdSchema,
  createJobStatusUpdateSchema,
} from "../schemas"
import type { ToggleFollowResult, UpdateStatusResult } from "../types"
import {
  notifyApplicationStatusChanged,
  notifyCompanyFollowed,
} from "../services/company-notifications"

type StatusPayload = { noop: boolean; status: string; oldStatus?: string }

/**
 * Toggle follow/unfollow công ty. Idempotent — trả luôn count mới để client
 * cập nhật optimistic.
 */
export async function toggleFollowCompanyAction(
  companyUserId: number,
): Promise<ToggleFollowResult> {
  const te = await getTranslations("companies.errors")
  const parsed = createCompanyUserIdSchema(te).safeParse(companyUserId)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<{ isFollowing: boolean; followerCount: number }>(
    supabase.rpc("toggle_follow_company", { p_company_user_id: parsed.data }),
  )

  if (result.ok) {
    // Trang public server-rendered → revalidate cho SEO/OG khi refresh.
    revalidatePath(`/company/${parsed.data}`)
    if (result.isFollowing) {
      await notifyCompanyFollowed({ companyUserId: parsed.data, current })
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Dashboard actions (owner-only). RPC tự check role + ownership.
// ---------------------------------------------------------------------------
export async function updateApplicationStatusAction(input: {
  applicationId: number
  newStatus: string
  note?: string | null
}): Promise<UpdateStatusResult> {
  const te = await getTranslations("companies.dashboardErrors")
  const parsed = createApplicationStatusUpdateSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<StatusPayload>(
    supabase.rpc("update_application_status", {
      p_application_id: parsed.data.applicationId,
      p_new_status: parsed.data.newStatus,
      p_note: parsed.data.note ?? null,
    }),
  )

  if (result.ok) {
    revalidatePath("/company/dashboard")
    if (!result.noop) {
      await notifyApplicationStatusChanged({
        supabase,
        applicationId: parsed.data.applicationId,
        newStatus: parsed.data.newStatus,
        current,
      })
    }
  }
  return result
}

export async function updateJobStatusAction(input: {
  jobId: number
  newStatus: string
}): Promise<UpdateStatusResult> {
  const te = await getTranslations("companies.dashboardErrors")
  const parsed = createJobStatusUpdateSchema(te).safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? te("unknown") }
  }

  await requireCurrentUser()
  const supabase = await createClient()

  const result = await rpcResult<StatusPayload>(
    supabase.rpc("update_job_status", {
      p_job_id: parsed.data.jobId,
      p_new_status: parsed.data.newStatus,
    }),
  )

  if (result.ok) revalidatePath("/company/dashboard")
  return result
}
