"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import type { ConversationItem } from "../types"

type Props = {
  items: ConversationItem[]
  activeId: number | null
  onSelect: (conv: ConversationItem) => void
  pendingOtherUserId?: number | null
}

export function ConversationList({
  items,
  activeId,
  onSelect,
  pendingOtherUserId,
}: Props) {
  const t = useTranslations("messages")
  const [q, setQ] = useState("")
  const formatRel = useRelativeTimeFormatter()

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((c) =>
      (c.displayName ?? "").toLowerCase().includes(needle),
    )
  }, [items, q])

  return (
    <>
      <div className="p-4 border-b border-border/40">
        <h1 className="font-headline font-bold text-xl">{t("title")}</h1>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 rounded-full bg-muted border-none text-sm"
            placeholder={t("searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {t("listEmpty")}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive =
              conv.conversationId != null && conv.conversationId === activeId
            const isPending = pendingOtherUserId === conv.otherUserId
            const last = conv.lastContent ?? t("noMessages")
            const time = conv.lastCreatedAt
              ? formatRel(conv.lastCreatedAt)
              : ""
            const name = conv.displayName ?? "—"
            const key =
              conv.conversationId ?? `user-${conv.otherUserId}`
            return (
              <button
                key={key}
                disabled={isPending}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b border-border/20 last:border-b-0 disabled:opacity-60 ${
                  isActive ? "bg-primary/5" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-11 h-11">
                    {conv.avatarUrl ? (
                      <AvatarImage src={conv.avatarUrl} alt={name} />
                    ) : null}
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm truncate ${
                        conv.unreadCount > 0
                          ? "font-bold text-foreground"
                          : "font-semibold"
                      }`}
                    >
                      {name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {time}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      conv.unreadCount > 0
                        ? "text-foreground/80 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {last}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
      {filtered.length === 0 && q.trim() === "" ? (
        <div className="p-4 border-t border-border/30 text-[11px] text-muted-foreground">
          <Link href="/network" className="text-primary hover:underline">
            {t("findConnections")}
          </Link>
        </div>
      ) : null}
    </>
  )
}
