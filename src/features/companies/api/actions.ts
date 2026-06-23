"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { writeAuditLog } from "@/lib/audit"
import { createClient } from "@/lib/supabase/server"
import { rpcResult } from "@/lib/action/rpc"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { requirePermission } from "@/lib/rbac"

import {
  createCompanyUserIdSchema,
  createJobStatusUpdateSchema,
} from "../schemas"
import type {
  ResubmitVerificationResult,
  ToggleFollowResult,
  UpdateStatusResult,
} from "../types"
import {
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

  const current = await requirePermission("companies.follow")
  await checkRateLimit(current.appUser.id, "follow", 20, 60) // 20 follows / 60s
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
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.isFollowing ? "company.follow" : "company.unfollow",
      entityType: "follows",
      entityId: parsed.data,
    })
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

  const current = await requirePermission("jobs.edit")
  const supabase = await createClient()

  const result = await rpcResult<StatusPayload>(
    supabase.rpc("update_job_status", {
      p_job_id: parsed.data.jobId,
      p_new_status: parsed.data.newStatus,
    }),
  )

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.job_status_update",
      entityType: "jobs",
      entityId: parsed.data.jobId,
      newData: {
        newStatus: parsed.data.newStatus,
        oldStatus: result.oldStatus,
      },
    })
  }
  return result
}

/**
 * Company gửi lại hồ sơ xác minh khi đang ở 'rejected' / 'pending_update'
 * (FR-M02-007). RPC tự check role + trạng thái hợp lệ.
 */
export async function resubmitCompanyVerificationAction(): Promise<ResubmitVerificationResult> {
  const current = await requirePermission("companies.edit")
  const supabase = await createClient()

  const result = await rpcResult<{ status: "pending" }>(
    supabase.rpc("resubmit_company_verification"),
  )

  if (result.ok) {
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "company.verification_resubmit",
      entityType: "company_profiles",
      entityId: current.appUser.id,
      newData: { status: "pending" },
    })
    revalidatePath("/settings")
  }
  return result
}
