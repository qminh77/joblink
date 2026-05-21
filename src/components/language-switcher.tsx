"use client"

import { useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Globe, Languages } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { setLocaleAction } from "@/i18n/actions"
import { locales, type Locale } from "@/i18n/config"

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("languageSwitcher")

  function onChange(next: string) {
    if (next === locale) return
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label={t("label")}
          className={className}
        >
          <Globe className="size-5" />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 p-1.5 rounded-2xl bg-background"
      >
        <DropdownMenuGroup>
          {locales.map((value, index) => {
            const isActive = value === locale
            const code = value as Locale
            const Icon = isActive ? Check : code === "vi" ? Globe : Languages
            return (
              <motion.div
                key={value}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.05 + index * 0.03 }}
              >
                <DropdownMenuItem
                  onClick={() => onChange(value)}
                  disabled={isPending}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                >
                  <Icon
                    className={cn(
                      "w-4.5 h-4.5 mr-3 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm font-medium block truncate",
                        isActive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {t(code)}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t(`${code}Hint` as const)}
                    </p>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
