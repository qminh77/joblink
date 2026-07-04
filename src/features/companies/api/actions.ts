"use server"

// SRS UC Trace - M03 Ho so cong ty:
// UC-23 Gui lai yeu cau xac minh; UC-25 Theo doi/bo theo doi cong ty.
// Flow: settings/company page -> company action -> company service/RPC -> company_profiles/follows.

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/action/rate-limit"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { createCompanyUserIdSchema } from "../schemas"
import type {
  ResubmitVerificationResult,
  ToggleFollowResult,
} from "../types"
import { toggleCompanyFollow } from "../services/company-follow.service"
import { resubmitCompanyVerification } from "../services/company-verification.service"

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
  await checkRateLimit(current.appUser.id, "follow", 20, 60) // 20 follows / 60s
  const supabase = await createClient()

  const result = await toggleCompanyFollow(supabase, current, parsed.data)

  if (result.ok) {
    // Trang public server-rendered → revalidate cho SEO/OG khi refresh.
    revalidatePath(`/company/${parsed.data}`)
  }
  return result
}

/**
 * Company gửi lại hồ sơ xác minh khi đang ở 'rejected' / 'pending_update'
 * (FR-M02-007). RPC tự check role + trạng thái hợp lệ.
 */
export async function resubmitCompanyVerificationAction(): Promise<ResubmitVerificationResult> {
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const result = await resubmitCompanyVerification(supabase, current)

  if (result.ok) {
    revalidatePath("/settings")
  }
  return result
}
