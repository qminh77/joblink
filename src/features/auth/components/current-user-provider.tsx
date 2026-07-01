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
