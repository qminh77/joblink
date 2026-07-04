import "server-only"

// SRS UC Trace - M02 Ho so ca nhan:
// UC-14 Xem ho so nguoi dung; UC-15 Xem thong ke ho so ca nhan.
// Flow: /profile/[id]|/profile/edit -> server query -> profile service/repo
// -> visibility + view log data.

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  getOwnCompanyProfile,
  getOwnMemberProfile,
  getProfileEditOverview,
  getProfilePageData,
} from "../services/profile-query.service"
import type {
  CompanyProfileDetail,
  MemberProfileDetail,
  ProfileEditOverview,
  ProfilePageData,
} from "../types"

export type { ProfileEditOverview } from "../types"

export async function loadProfileById(
  targetUserId: number,
): Promise<ProfilePageData | null> {
  const supabase = await createClient()
  return getProfilePageData(supabase, targetUserId)
}

export async function loadOwnMemberProfile(): Promise<MemberProfileDetail | null> {
  const current = await getCurrentUser()
  if (!current) return null

  const supabase = await createClient()
  return getOwnMemberProfile(supabase, current.appUser)
}

export async function loadProfileEditOverview(): Promise<ProfileEditOverview | null> {
  const current = await getCurrentUser()
  if (!current) return null

  const supabase = await createClient()
  return getProfileEditOverview(supabase, current.appUser)
}

export async function loadOwnCompanyProfile(): Promise<CompanyProfileDetail | null> {
  const current = await getCurrentUser()
  if (!current) return null

  const supabase = await createClient()
  return getOwnCompanyProfile(supabase, current.appUser)
}
