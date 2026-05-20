"use client"

import { useTranslations } from "next-intl"
import { LogOut } from "lucide-react"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useLogout } from "../hooks"

export function LogoutMenuItem() {
  const logout = useLogout()
  const t = useTranslations("auth.logout")
  const tCommon = useTranslations("common")

  return (
    <DropdownMenuItem
      disabled={logout.isPending}
      onSelect={(event) => {
        event.preventDefault()
        logout.mutate()
      }}
      className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted text-foreground"
    >
      <LogOut className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">
          {logout.isPending ? tCommon("submitting") : t("menu")}
        </span>
      </div>
    </DropdownMenuItem>
  )
}
