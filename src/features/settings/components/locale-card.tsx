"use client"

import { useState } from "react"

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

const OPTIONS: Array<{ value: LocaleInput["locale"]; label: string }> = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
]

export function LocaleCard({ initialLocale }: { initialLocale: string }) {
  const [locale, setLocale] = useState<LocaleInput["locale"]>(
    initialLocale === "en" ? "en" : "vi",
  )
  const updateLocale = useUpdateLocale()

  return (
    <Card className="rounded-2xl border-border/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            Ngôn ngữ
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Hệ thống hiển thị giao diện theo ngôn ngữ bạn chọn
          </p>
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
              {OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={updateLocale.isPending || locale === initialLocale}
            onClick={() => updateLocale.mutate({ locale })}
            className="h-10 rounded-lg"
          >
            Lưu
          </Button>
        </div>
      </div>
    </Card>
  )
}
