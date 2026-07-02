import { NextResponse, type NextRequest } from "next/server"

// SRS UC Trace - M01:
// UC-03 Xac minh email dang ky; UC-05 OAuth callback; UC-07 reset password callback when Supabase returns a code.
// Flow: Supabase email/OAuth link -> /auth/callback -> exchangeCodeForSession -> redirect to target screen.

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/home"

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
