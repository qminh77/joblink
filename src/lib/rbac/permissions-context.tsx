"use client"

import { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"

const PermissionsContext = createContext<Set<string>>(new Set())

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[]
  children: ReactNode
}) {
  const value = useMemo(() => new Set(permissions), [permissions])
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions(): Set<string> {
  return useContext(PermissionsContext)
}

export function useHasPermission(permission: string): boolean {
  const permissions = usePermissions()
  return permissions.has(permission)
}

export function useHasAnyPermission(permList: string[]): boolean {
  const permissions = usePermissions()
  return permList.some((p) => permissions.has(p))
}

export function useHasAllPermissions(permList: string[]): boolean {
  const permissions = usePermissions()
  return permList.every((p) => permissions.has(p))
}
