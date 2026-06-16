"use client"

import { useTranslations } from "next-intl"
import { Bell, Trash2 } from "lucide-react"

import {
  useCreateJobAlert,
  useDeleteJobAlert,
  useJobAlerts,
} from "../hooks"
import type { JobAlertFilters } from "../types"

// UC-57/58: panel trong cột lọc trang việc làm — lưu bộ lọc hiện tại thành cảnh
// báo và quản lý (xóa) các cảnh báo đã tạo.
export function JobAlertsPanel({
  currentFilters,
  currentName,
}: {
  currentFilters: JobAlertFilters
  currentName: string
}) {
  const t = useTranslations("jobs.alerts")
  const { data: alerts } = useJobAlerts()
  const create = useCreateJobAlert()
  const remove = useDeleteJobAlert()
  const list = alerts ?? []

  return (
    <div className="mt-5 pt-5 border-t border-border/40">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {t("title")}
      </h3>

      <button
        type="button"
        onClick={() =>
          create.mutate({ name: currentName, filters: currentFilters })
        }
        disabled={create.isPending}
        className="inline-flex w-full items-center justify-center gap-1.5 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/10 px-2.5 h-8 rounded-lg transition-colors disabled:opacity-50"
      >
        <Bell className="w-3.5 h-3.5" /> {t("create")}
      </button>

      {list.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {list.map((a) => (
            <li key={a.id} className="flex items-center gap-2 group">
              <Bell className="w-3 h-3 text-muted-foreground shrink-0" />
              <span
                className="flex-1 min-w-0 truncate text-xs text-foreground"
                title={a.name}
              >
                {a.name}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate(a.id)}
                disabled={remove.isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={t("delete")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  )
}
