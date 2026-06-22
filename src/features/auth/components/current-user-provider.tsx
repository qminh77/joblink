"use client"

import { createContext, useContext } from "react"

import type { SessionUserSummary } from "../types"

const CurrentUserContext = createContext<SessionUserSummary | null>(null)

export function CurrentUserProvider({
  user,
  children,
}: {
  user: SessionUserSummary
  children: React.ReactNode
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser(): SessionUserSummary {
  const value = useContext(CurrentUserContext)
  if (!value) {
    throw new Error(
      "useCurrentUser must be used inside CurrentUserProvider",
    )
  }
  return value
}

export function useCurrentUserPermissions(): Set<string> {
  const user = useCurrentUser()
  return new Set(user.permissions)
}

export function useCurrentUserHasPermission(permission: string): boolean {
  const user = useCurrentUser()
  return user.permissions.includes(permission)
}

export function useCurrentUserHasAnyPermission(permissions: string[]): boolean {
  const user = useCurrentUser()
  return permissions.some((permission) => user.permissions.includes(permission))
}
