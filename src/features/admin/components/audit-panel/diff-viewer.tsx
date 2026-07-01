"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

function formatValue(value: unknown) {
  return typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")
}

export function DiffViewer({
  oldData,
  newData,
}: {
  oldData: unknown
  newData: unknown
}) {
  const [open, setOpen] = useState(false)

  const changes = useMemo(() => {
    if (!oldData && !newData) return []
    const before = (oldData ?? {}) as Record<string, unknown>
    const after = (newData ?? {}) as Record<string, unknown>
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return Array.from(keys)
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
      .map((key) => ({ key, from: before[key], to: after[key] }))
  }, [oldData, newData])

  if (changes.length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {changes.length} change{changes.length !== 1 ? "s" : ""}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-muted">
          {changes.map(({ key, from, to }) => (
            <div
              key={key}
              className="text-[11px] text-muted-foreground flex gap-2"
            >
              <span className="font-medium shrink-0 min-w-[60px]">{key}:</span>
              <span className="line-through text-red-400/70">
                {formatValue(from)}
              </span>
              <span className="text-green-500/70">{formatValue(to)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
