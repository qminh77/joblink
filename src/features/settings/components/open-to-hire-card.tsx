"use client"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useUpdateOpenToHire } from "@/features/settings/hooks"

export function OpenToHireCard({ initialValue }: { initialValue: boolean }) {
  const mutation = useUpdateOpenToHire()
  const t = useTranslations("settings.openToHire")

  return (
    <Card className="rounded-2xl border-border/30 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Switch
          defaultChecked={initialValue}
          disabled={mutation.isPending}
          onCheckedChange={(value) => mutation.mutate(value)}
        />
      </div>
    </Card>
  )
}
