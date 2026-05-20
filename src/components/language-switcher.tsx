"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Check, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setLocaleAction } from "@/i18n/actions"
import { locales, localeLabels, type Locale } from "@/i18n/config"

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onChange(next: string) {
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className={cn("rounded-full h-9 px-3", className)}
          disabled={isPending}
          aria-label="Language"
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="uppercase text-xs font-semibold">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        {locales.map((value) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onChange(value)}
            className="cursor-pointer"
          >
            <span className="flex-1">{localeLabels[value as Locale]}</span>
            {value === locale && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
