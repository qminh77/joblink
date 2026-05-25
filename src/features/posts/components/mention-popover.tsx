"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils/format"

import { searchMentionableUsersAction, type MentionableUser } from "../api/actions"

const DEBOUNCE_MS = 200

export function MentionPopover({
  query,
  activeIndex,
  onPick,
  onResults,
}: {
  query: string
  activeIndex: number
  onPick: (user: MentionableUser) => void
  // Cho parent biết list hiện có để bound activeIndex và xử lý Enter.
  onResults: (users: MentionableUser[]) => void
}) {
  const t = useTranslations("feed")
  const [users, setUsers] = useState<MentionableUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (query.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const list = await searchMentionableUsersAction(query)
        if (cancelled) return
        setUsers(list)
        onResults(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
    // onResults là callback ổn định từ parent — phụ thuộc duy nhất là query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  if (query.length === 0) return null

  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 bottom-full mb-1 z-20 max-h-64 overflow-y-auto rounded-xl border border-border/40 bg-popover shadow-lg"
    >
      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-3 text-[12px] text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{t("mentionSearching")}</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-3 text-center text-[12px] text-muted-foreground">
          {t("mentionNoResults")}
        </div>
      ) : (
        users.map((u, i) => {
          const active = i === activeIndex
          return (
            <button
              key={u.userId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onPick(u)
              }}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 transition-colors ${
                active ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <Avatar className="w-7 h-7">
                {u.avatarUrl ? <AvatarImage src={u.avatarUrl} /> : null}
                <AvatarFallback className="text-[10px]">
                  {getInitials(u.displayName, "JL")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium truncate">
                  {u.displayName}
                </div>
                {u.headline ? (
                  <div className="text-[10.5px] text-muted-foreground truncate">
                    {u.headline}
                  </div>
                ) : null}
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
