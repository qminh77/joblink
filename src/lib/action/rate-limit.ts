import "server-only"

import { ActionError } from "./server"
import { createClient } from "@/lib/supabase/server"

/**
 * Kiểm tra rate limit cho user.
 * Dùng sliding window: đếm số request trong window, nếu vượt max → throw ActionError.
 *
 * @param userId - ID của user (bigint)
 * @param actionType - Loại hành động: 'post', 'comment', 'reaction', 'share'
 * @param maxRequests - Số request tối đa trong window (mặc định: 10)
 * @param windowSeconds - Kích thước window tính bằng giây (mặc định: 10)
 */
export async function checkRateLimit(
  userId: number,
  actionType: string,
  maxRequests = 10,
  windowSeconds = 10,
): Promise<void> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_action_type: actionType,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    console.error("[rateLimit]", error)
    return // Không block user nếu rate limit check fail
  }

  if (data === false) {
    throw ActionError.text("Too many requests. Please try again later.")
  }
}
