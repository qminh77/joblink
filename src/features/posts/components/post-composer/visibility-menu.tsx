"use client"

import { Globe, Lock, Users } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Visibility = "public" | "connections" | "private"

export const VISIBILITY_OPTIONS = [
  { value: "public", icon: Globe },
  { value: "connections", icon: Users },
  { value: "private", icon: Lock },
] as const

export function VisibilityMenu({
  visibility,
  onChange,
}: {
  visibility: Visibility
  onChange: (value: Visibility) => void
}) {
  const tVis = useTranslations("posts.visibility")
  const currentVisIcon =
    VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.icon ?? Globe
  const Icon = currentVisIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="text-[11px] bg-muted px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <Icon className="w-3 h-3" />
          <span>{tVis(visibility)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {VISIBILITY_OPTIONS.map(({ value, icon: MenuIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onChange(value as Visibility)}
            className="cursor-pointer"
          >
            <MenuIcon className="w-4 h-4 mr-2 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{tVis(value)}</span>
              <span className="text-[11px] text-muted-foreground">
                {tVis(`${value}Hint`)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
