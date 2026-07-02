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
  const { pathname, search } = request.nextUrl
  const isPublic = isPublicPath(pathname)
  const isRoot = pathname === "/"
  const isAuthCallback = pathname.startsWith("/auth/callback")
  const hasAuthCookie = hasSupabaseAuthCookie(request)

  if (!hasAuthCookie) {
    if (!isPublic && !isRoot) {
      return redirectToLogin(request, pathname + (search ?? ""))
    }
    if (isRoot) return redirectToLogin(request)
    return NextResponse.next({ request })
  }

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

  if (user && !isAuthCallback && (isPublic || isRoot)) {
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
    return redirectToLogin(request, pathname + (search ?? ""))
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
    return redirectToLogin(request)
  }

  return supabaseResponse
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      ({ name }) =>
        name.startsWith("sb-") &&
        (name.includes("auth-token") || name.includes("auth-token.")),
    )
}

function redirectToLogin(request: NextRequest, redirect?: string) {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""
  if (redirect && redirect !== "/login") {
    url.searchParams.set("redirect", redirect)
  }
  return NextResponse.redirect(url)
}

async function getBlockedSessionReason(
  supabase: ReturnType<typeof createServerClient<Database>>,
  authId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .maybeSingle<{ id: number; role: string; status: string }>()

  if (!data) return "account_missing"
  if (
    data.role === "company" &&
    data.status === "pending_verification"
  ) {
    return "company_pending"
  }
  if (data.role === "company" && data.status === "active") {
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
