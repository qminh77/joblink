import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import type { getTranslations } from "next-intl/server"

type JobTranslator = Awaited<ReturnType<typeof getTranslations>>

export function ensureCompanyCanManageJobs(
  current: CurrentUser,
  te: JobTranslator,
): { ok: false; error: string } | null {
  if (current.appUser.role !== "company") {
    return { ok: false, error: te("notCompany") }
  }
  if (
    current.appUser.status !== "active" ||
    current.profile.companyVerificationStatus !== "verified"
  ) {
    return { ok: false, error: te("companyPendingApproval") }
  }
  return null
}
