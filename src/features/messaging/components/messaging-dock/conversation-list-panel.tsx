"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { MessageSquare, Search, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import type { ConversationItem } from "../../types"
import { BOTTOM_EDGE } from "./constants"

type ConversationListPanelProps = {
  conversations: ConversationItem[]
  listPanelRight: number
  openConversationIds: Set<number>
  pendingOtherUserId?: number
  query: string
  unreadConversations: number
  onClose: () => void
  onQueryChange: (value: string) => void
  onSelectConversation: (conversation: ConversationItem) => void
}

export function ConversationListPanel({
  conversations,
  listPanelRight,
  openConversationIds,
  pendingOtherUserId,
  query,
  unreadConversations,
  onClose,
  onQueryChange,
  onSelectConversation,
}: ConversationListPanelProps) {
  const t = useTranslations("messages")
  const formatRel = useRelativeTimeFormatter()
  const hasQuery = query.trim().length > 0

  return (
    <div
      className="hidden lg:flex fixed z-50 w-80 max-h-[min(520px,calc(100vh-7rem))] bg-card border border-border/40 rounded-2xl shadow-2xl shadow-black/10 flex-col overflow-hidden"
      style={{ right: `${listPanelRight}px`, bottom: `${BOTTOM_EDGE}px` }}
    >
      <div className="h-12 px-3 border-b border-border/30 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-foreground" />
          <span className="font-headline font-bold text-sm truncate">
            {t("title")}
          </span>
          {unreadConversations > 0 ? (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadConversations > 99 ? "99+" : unreadConversations}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("dock.close")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border/30 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-muted/60 rounded-full pl-8 pr-8 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-primary"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground cursor-pointer"
              aria-label={t("dock.clearSearch")}
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {hasQuery ? t("listEmpty") : t("dropdown.empty")}
          </div>
        ) : (
          conversations.map((conv) => {
            const name = conv.displayName ?? "—"
            const isOpen =
              conv.conversationId != null &&
              openConversationIds.has(conv.conversationId)
            const isPending = pendingOtherUserId === conv.otherUserId

            return (
              <button
                key={conv.conversationId ?? `user-${conv.otherUserId}`}
                type="button"
                onClick={() => onSelectConversation(conv)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/10 last:border-b-0 cursor-pointer",
                  isOpen && "bg-primary/[0.04]",
                  isPending && "opacity-50 pointer-events-none",
                )}
              >
                <Avatar className="w-9 h-9 shrink-0">
                  {conv.avatarUrl ? (
                    <AvatarImage src={conv.avatarUrl} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[13px] truncate ${
                        conv.unreadCount > 0 ? "font-bold" : "font-semibold"
                      }`}
                    >
                      {name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {conv.lastCreatedAt ? formatRel(conv.lastCreatedAt) : ""}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      conv.unreadCount > 0
                        ? "text-foreground/80 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {conv.lastContent ?? t("noMessages")}
                  </p>
                </div>
                {conv.unreadCount > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                ) : null}
              </button>
            )
          })
        )}
      </div>

      <Link
        href="/messages"
        className="text-center text-[11px] font-semibold text-primary py-2 border-t border-border/30 hover:bg-muted/30 shrink-0"
        onClick={onClose}
      >
        {t("dropdown.viewAll")}
      </Link>
    </div>
  )
}
