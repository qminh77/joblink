import "server-only"

// SRS UC Trace - M01 UC-06 Kiem tra dieu kien truy cap tai khoan.
// Flow: middleware/server component/server action -> getCurrentUser/requireCurrentUser -> public.users + profile status guard.

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/features/auth/lib/constants"

import {
  getAppUserByAuthId,
  getCompanyProfileSummary,
  getMemberProfileSummary,
} from "../data/auth.repo"
import type { CurrentUser } from "../types"

// Xác minh JWT cục bộ thay vì gọi mạng tới Auth server (getUser()).
// Middleware (proxy.ts) đã refresh phiên ở đầu mỗi request nên tại đây chỉ cần
// đọc claims đã được đảm bảo còn hạn. cache() dedupe trong cùng một request.
export const getAuthUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims?.sub ?? null
})

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const authId = await getAuthUserId()
  if (!authId) return null

  const supabase = await createClient()

  const { data: appUser } = await getAppUserByAuthId(supabase, authId)

  if (!appUser) return null

  const profile =
    appUser.role === "company"
      ? await loadCompanyProfile(supabase, appUser.id)
      : await loadMemberProfile(supabase, appUser.id)

  return {
    appUser,
    profile,
  }
})

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const blockedReason = getBlockedCurrentUserReason(user)
  if (blockedReason) redirect(`/login?reason=${blockedReason}`)
  return user
}

export async function requireUserRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireCurrentUser()
  if (user.appUser.role !== role) redirect("/home")
  return user
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

async function loadMemberProfile(supabase: SupabaseServer, userId: number) {
  const { data } = await getMemberProfileSummary(supabase, userId)

  return {
    displayName: data?.full_name ?? "Thành viên",
    avatarUrl: data?.avatar_url ?? null,
    coverUrl: data?.cover_url ?? null,
    headline: data?.headline ?? null,
  }
}

async function loadCompanyProfile(supabase: SupabaseServer, userId: number) {
  const { data } = await getCompanyProfileSummary(supabase, userId)

  return {
    displayName: data?.name ?? "Công ty",
    avatarUrl: data?.logo_url ?? null,
    coverUrl: data?.cover_url ?? null,
    headline: data?.industry ?? null,
    companyVerificationStatus: data?.verification_status ?? null,
  }
}

function getBlockedCurrentUserReason(user: CurrentUser) {
  const { appUser, profile } = user
  if (
    appUser.role === "company" &&
    appUser.status === "pending_verification"
  ) {
    return "company_pending"
  }
  if (
    appUser.role === "company" &&
    appUser.status === "active" &&
    profile.companyVerificationStatus !== "verified"
  ) {
    return "company_pending"
  }
  if (appUser.status === "suspended") return "account_suspended"
  if (appUser.status === "banned" || appUser.status === "deleted") {
    return "account_banned"
  }
  return null
}
