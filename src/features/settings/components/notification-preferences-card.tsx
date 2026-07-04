"use client"

import React from "react"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "@/features/notifications/hooks"
import {
  NOTIFICATION_CATEGORIES,
  defaultPreferenceMap,
} from "@/features/notifications/lib/preferences"

// SRS UC-55: bật/tắt thông báo theo nhóm trên 2 kênh (trong ứng dụng + email).
// Kênh trong-ứng-dụng có hiệu lực ngay (gate ở createNotification); email được
// lưu sẵn cho khi hệ thống bật gửi email theo sự kiện.
export function NotificationPreferencesCard() {
  const t = useTranslations("settings.notifications")
  const tn = useTranslations("settings.notifications.items")
  const { data, isLoading } = useNotificationPreferences()
  const update = useUpdateNotificationPreference()
  const prefs = data ?? defaultPreferenceMap()

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-1">
      <h2 className="font-headline font-bold text-base text-foreground mb-1">
        {t("title")}
      </h2>
      <p className="text-xs text-muted-foreground mb-4">{t("subtitle")}</p>

      <div className="flex items-center justify-end gap-4 pr-1 pb-1">
        <span className="w-12 text-center text-[11px] font-medium text-muted-foreground">
          {t("inApp")}
        </span>
        <span className="w-12 text-center text-[11px] font-medium text-muted-foreground">
          {t("email")}
        </span>
      </div>

      {NOTIFICATION_CATEGORIES.map((key) => {
        return (
          <NotificationCategoryRow
            key={key}
            categoryKey={key}
            pref={prefs[key]}
            isLoading={isLoading}
            update={update}
            tn={tn}
            t={t}
          />
        )
      })}
    </Card>
  )
}

function NotificationCategoryRow({ categoryKey, pref, isLoading, update, tn, t }: any) {
  const [optimisticPref, addOptimisticPref] = React.useOptimistic(
    pref,
    (_state, nextPref: { inApp: boolean; email: boolean }) => nextPref
  )

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{tn(categoryKey)}</p>
        <p className="text-xs text-muted-foreground">{tn(`${categoryKey}Desc`)}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="w-12 flex justify-center">
          <Switch
            checked={optimisticPref.inApp}
            disabled={isLoading}
            aria-label={`${tn(categoryKey)} — ${t("inApp")}`}
            onCheckedChange={(value) => {
              React.startTransition(async () => {
                const nextPref = { ...optimisticPref, inApp: value }
                addOptimisticPref(nextPref)
                await update.mutateAsync({
                  category: categoryKey,
                  ...nextPref,
                }).catch(() => {})
              })
            }}
          />
        </div>
        <div className="w-12 flex justify-center">
          <Switch
            checked={optimisticPref.email}
            disabled={isLoading}
            aria-label={`${tn(categoryKey)} — ${t("email")}`}
            onCheckedChange={(value) => {
              React.startTransition(async () => {
                const nextPref = { ...optimisticPref, email: value }
                addOptimisticPref(nextPref)
                await update.mutateAsync({
                  category: categoryKey,
                  ...nextPref,
                }).catch(() => {})
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
