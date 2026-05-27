import type { User } from "@supabase/supabase-js"

import type { UserRole, UserStatus } from "@/lib/constants"
import type { AppUserRow } from "@/types/database"

export type CurrentUser = {
  authUser: User
  appUser: AppUserRow
  profile: {
    displayName: string
    avatarUrl: string | null
    coverUrl: string | null
    headline: string | null
  }
}

export type SessionUserSummary = {
  id: number
  authId: string
  email: string
  role: UserRole
  status: UserStatus
  displayName: string
  avatarUrl: string | null
  coverUrl: string | null
  headline: string | null
}
