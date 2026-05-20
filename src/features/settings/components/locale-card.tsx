"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateLocale } from "@/features/settings/hooks"
import type { LocaleInput } from "@/features/settings/schemas"
import { locales, localeLabels, type Locale } from "@/i18n/config"

export function LocaleCard({ initialLocale }: { initialLocale: string }) {
  const t = useTranslations("settings.locale")
  const tCommon = useTranslations("common")
  const [locale, setLocale] = useState<LocaleInput["locale"]>(
    initialLocale === "en" ? "en" : "vi",
  )
  const updateLocale = useUpdateLocale()

  return (
    <Card className="rounded-2xl border-border/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={locale}
            onValueChange={(value) => setLocale(value as LocaleInput["locale"])}
          >
            <SelectTrigger className="h-10 rounded-xl w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((value) => (
                <SelectItem key={value} value={value}>
                  {localeLabels[value as Locale]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={updateLocale.isPending || locale === initialLocale}
            onClick={() => updateLocale.mutate({ locale })}
            className="h-10 rounded-lg"
          >
            {updateLocale.isPending ? tCommon("saving") : t("save")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
