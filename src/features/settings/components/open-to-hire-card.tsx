"use client"

import React from "react"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useUpdateOpenToHire } from "@/features/settings/hooks"

export function OpenToHireCard({ initialValue }: { initialValue: boolean }) {
  const mutation = useUpdateOpenToHire()
  const t = useTranslations("settings.openToHire")

  const [optimisticValue, addOptimisticValue] = React.useOptimistic(
    initialValue,
    (_state, nextValue: boolean) => nextValue
  )

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Switch
          checked={optimisticValue}
          onCheckedChange={(value) => {
            React.startTransition(async () => {
              addOptimisticValue(value)
              await mutation.mutateAsync(value).catch(() => {})
            })
          }}
        />
      </div>
    </Card>
  )
}
