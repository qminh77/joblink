import { NextResponse, type NextRequest } from "next/server"

// SRS UC Trace - M01:
// UC-03 Xac minh email dang ky; UC-05 OAuth callback; UC-07 reset password callback when Supabase returns a code.
// Flow: Supabase email/OAuth link -> /auth/callback -> exchangeCodeForSession -> redirect to target screen.

import { createClient } from "@/lib/supabase/server"
import { logEmailChangeSuccess } from "@/features/auth/services/session.service"

import { type EmailOtpType } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/home"

  // Xử lý Implicit Flow bypass qua token_hash (dùng cho link tạo từ Admin API)
  if (token_hash && type) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      if (type === "email_change") {
        await logEmailChangeSuccess(data.user)
      }
      return NextResponse.redirect(new URL(next, origin))
    }
    // Nếu token hết hạn hoặc lỗi, có thể redirect về trang báo lỗi
    return NextResponse.redirect(new URL(`/login?error=auth_verify_failed_${type}`, origin))
  }

  // Xử lý PKCE Flow (từ OAuth hoặc Client-side generateLink)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin),
  )
}
