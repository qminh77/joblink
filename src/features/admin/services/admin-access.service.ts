import "server-only"

import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"

function isAdminRole(user: CurrentUser): boolean {
  return user.appUser.role === "admin"
}

/**
 * Yêu cầu user có role admin để vào khu vực quản trị.
 */
export async function requireAdminAccess(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  if (!isAdminRole(user)) redirect("/home")

  return user
}

/**
 * Kiểm tra user có role admin không (non-throwing)
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return isAdminRole(user)
}
