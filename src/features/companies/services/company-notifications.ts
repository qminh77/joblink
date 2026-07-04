import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { createNotification } from "@/features/notifications/services/notification-delivery.service"

// Notify follower mới cho chủ công ty. Unfollow KHÔNG trigger (tránh spam).
export async function notifyCompanyFollowed(opts: {
  companyUserId: number
  current: CurrentUser
}): Promise<void> {
  if (opts.current.appUser.id === opts.companyUserId) return
  await createNotification({
    userId: opts.companyUserId,
    type: "company_followed",
    payload: {
      type: "company_followed",
      userId: opts.current.appUser.id,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
    },
  })
}
