import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { AppUserRow } from "@/types/database"

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

  const { data: appUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .is("deleted_at", null)
    .maybeSingle<AppUserRow>()

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
  return user
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

async function loadMemberProfile(supabase: SupabaseServer, userId: number) {
  const { data } = await supabase
    .from("member_profiles")
    .select("full_name, avatar_url, cover_url, headline")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<{
      full_name: string
      avatar_url: string | null
      cover_url: string | null
      headline: string | null
    }>()

  return {
    displayName: data?.full_name ?? "Thành viên",
    avatarUrl: data?.avatar_url ?? null,
    coverUrl: data?.cover_url ?? null,
    headline: data?.headline ?? null,
  }
}

async function loadCompanyProfile(supabase: SupabaseServer, userId: number) {
  const { data } = await supabase
    .from("company_profiles")
    .select("name, logo_url, industry")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<{
      name: string
      logo_url: string | null
      industry: string | null
    }>()

  return {
    displayName: data?.name ?? "Công ty",
    avatarUrl: data?.logo_url ?? null,
    coverUrl: null,
    headline: data?.industry ?? null,
  }
}
