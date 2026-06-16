"use client"

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

// UC-65: bật/tắt thông báo theo nhóm trên 2 kênh (trong ứng dụng + email).
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
        const pref = prefs[key]
        const disabled = isLoading || update.isPending
        return (
          <div
            key={key}
            className="flex items-center justify-between gap-4 p-3.5 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{tn(key)}</p>
              <p className="text-xs text-muted-foreground">{tn(`${key}Desc`)}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 flex justify-center">
                <Switch
                  checked={pref.inApp}
                  disabled={disabled}
                  aria-label={`${tn(key)} — ${t("inApp")}`}
                  onCheckedChange={(value) =>
                    update.mutate({
                      category: key,
                      inApp: value,
                      email: pref.email,
                    })
                  }
                />
              </div>
              <div className="w-12 flex justify-center">
                <Switch
                  checked={pref.email}
                  disabled={disabled}
                  aria-label={`${tn(key)} — ${t("email")}`}
                  onCheckedChange={(value) =>
                    update.mutate({
                      category: key,
                      inApp: pref.inApp,
                      email: value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}
