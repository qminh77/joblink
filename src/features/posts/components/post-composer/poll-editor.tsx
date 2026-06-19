"use client"

import { Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

export function PollEditor({
  options,
  onChange,
}: {
  options: string[]
  onChange: (options: string[]) => void
}) {
  const tPosts = useTranslations("posts")

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
          <input
            value={opt}
            onChange={(e) => {
              const next = [...options]
              next[i] = e.target.value
              onChange(next)
            }}
            placeholder={tPosts("pollOption", { n: i + 1 })}
            maxLength={255}
            className="flex-1 bg-transparent border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
          />
          {options.length > 2 ? (
            <button
              type="button"
              onClick={() => {
                onChange(options.filter((_, idx) => idx !== i))
              }}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={tPosts("removeOption")}
            >
              <Minus className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ))}
      {options.length < 10 ? (
        <button
          type="button"
          onClick={() => onChange([...options, ""])}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
        >
          <Plus className="w-4 h-4" />
          <span>{tPosts("addOption")}</span>
        </button>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        {options.filter((o) => o.trim()).length < 2
          ? tPosts("minOptions")
          : null}
      </p>
    </div>
  )
}
