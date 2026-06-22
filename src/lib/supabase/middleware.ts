import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/types/database"

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/callback",
]

function isPublicPath(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  const isPublic = isPublicPath(pathname)
  const isRoot = pathname === "/"
  const isAuthCallback = pathname.startsWith("/auth/callback")

  if (user && !isAuthCallback) {
    const blockedReason = await getBlockedSessionReason(supabase, user.id)
    if (blockedReason) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.search = ""
      url.searchParams.set("reason", blockedReason)
      return NextResponse.redirect(url)
    }
  }

  if (!user && !isPublic && !isRoot) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    if (pathname !== "/login") {
      url.searchParams.set("redirect", pathname + (search ?? ""))
    }
    return NextResponse.redirect(url)
  }

  if (user && (isPublic || isRoot)) {
    if (isAuthCallback) {
      return supabaseResponse
    }
    const url = request.nextUrl.clone()
    url.pathname = "/home"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (!user && isRoot) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

async function getBlockedSessionReason(
  supabase: ReturnType<typeof createServerClient<Database>>,
  authId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("id, account_type, status")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; account_type: string; status: string }>()

  if (!data) return "account_missing"
  if (
    data.account_type === "company" &&
    data.status === "pending_verification"
  ) {
    return "company_pending"
  }
  if (data.account_type === "company" && data.status === "active") {
    const { data: company } = await supabase
      .from("company_profiles")
      .select("verification_status")
      .eq("user_id", data.id)
      .is("deleted_at", null)
      .maybeSingle<{ verification_status: string }>()
    if (company?.verification_status !== "verified") {
      return "company_pending"
    }
  }
  if (data.status === "suspended") return "account_suspended"
  if (data.status === "banned" || data.status === "deleted") {
    return "account_banned"
  }
  return null
}
