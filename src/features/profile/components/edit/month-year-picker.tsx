"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Props = {
  // "YYYY-MM" — schema regex `^\d{4}-\d{2}(-\d{2})?$`. DB DATE thêm "-01" ở repo.
  value: string | null | undefined
  onChange: (value: string) => void
  disabled?: boolean
  minYear?: number
  maxYear?: number
}

function parse(value: string | null | undefined): { y: number | null; m: number | null } {
  if (!value) return { y: null, m: null }
  const [ys, ms] = value.split("-")
  const y = /^\d{4}$/.test(ys ?? "") ? Number(ys) : null
  const m = /^\d{2}$/.test(ms ?? "") ? Number(ms) : null
  return { y, m: m && m >= 1 && m <= 12 ? m : null }
}

export function MonthYearPicker({
  value,
  onChange,
  disabled,
  minYear,
  maxYear,
}: Props) {
  const locale = useLocale()
  const t = useTranslations("common.monthPicker")

  const now = new Date()
  const max = maxYear ?? now.getFullYear() + 5
  const min = minYear ?? 1960

  const { y, m } = parse(value)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState<number>(y ?? now.getFullYear())

  const monthLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short" })
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)))
  }, [locale])

  const triggerLabel = useMemo(() => {
    if (!y || !m) return t("placeholder")
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" })
      .format(new Date(y, m - 1, 1))
  }, [y, m, locale, t])

  function pick(monthIdx: number) {
    const mm = String(monthIdx + 1).padStart(2, "0")
    onChange(`${viewYear}-${mm}`)
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange("")
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (disabled) return
        setOpen(o)
        if (o) setViewYear(y ?? now.getFullYear())
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "h-10 w-full rounded-xl border bg-transparent px-3 text-sm",
            "inline-flex items-center justify-between gap-2",
            "hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-60",
            !y || !m ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{triggerLabel}</span>
          </span>
          {value && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label={t("clear")}
              onClick={clear}
              className="w-5 h-5 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 p-2">
        <div className="flex items-center justify-between px-1 pb-2">
          <button
            type="button"
            onClick={() => setViewYear((v) => Math.max(min, v - 1))}
            disabled={viewYear <= min}
            aria-label={t("prevYear")}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium tabular-nums">{viewYear}</div>
          <button
            type="button"
            onClick={() => setViewYear((v) => Math.min(max, v + 1))}
            disabled={viewYear >= max}
            aria-label={t("nextYear")}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {monthLabels.map((label, i) => {
            const selected = y === viewYear && m === i + 1
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className={cn(
                  "h-9 rounded-md text-sm transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground",
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
