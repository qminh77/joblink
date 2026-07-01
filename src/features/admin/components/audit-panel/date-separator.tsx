"use client"

import { useTranslations } from "next-intl"

export function DateSeparator({ date }: { date: string }) {
  const t = useTranslations("admin.audit")
  const current = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let label: string
  if (current.toDateString() === today.toDateString()) {
    label = t("today", { defaultValue: "Today" })
  } else if (current.toDateString() === yesterday.toDateString()) {
    label = t("yesterday", { defaultValue: "Yesterday" })
  } else {
    label = current.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
