"use client"

import { useTranslations } from "next-intl"
import { MessageSquare } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils/format"

import type { ConversationItem } from "../../types"

type DockRailProps = {
  hiddenRailCount: number
  listOpen: boolean
  openConversationIds: Set<number>
  railItems: ConversationItem[]
  unreadConversations: number
  onOpenList: () => void
  onToggleConversation: (conversation: ConversationItem) => void
  onToggleList: () => void
}

export function DockRail({
  hiddenRailCount,
  listOpen,
  openConversationIds,
  railItems,
  unreadConversations,
  onOpenList,
  onToggleConversation,
  onToggleList,
}: DockRailProps) {
  const t = useTranslations("messages")

  return (
    <div
      className="hidden lg:flex fixed right-4 bottom-4 z-50 flex-col items-center gap-3"
      aria-label={t("title")}
    >
      {railItems.map((conv) => {
        const name = conv.displayName ?? "—"
        const isOpen =
          conv.conversationId != null &&
          openConversationIds.has(conv.conversationId)

        return (
          <button
            key={conv.conversationId ?? `rail-${conv.otherUserId}`}
            type="button"
            onClick={() => onToggleConversation(conv)}
            className={cn(
              "group relative size-12 rounded-full bg-card shadow-xl shadow-black/10 ring-1 ring-border/50 transition-all hover:-translate-y-0.5 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isOpen && "ring-2 ring-primary",
            )}
            title={name}
            aria-label={`${t("button.message")} ${name}`}
          >
            <Avatar className="size-12 border-2 border-card">
              {conv.avatarUrl ? (
                <AvatarImage src={conv.avatarUrl} alt={name} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            {conv.unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center ring-2 ring-background">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            ) : null}
          </button>
        )
      })}

      {hiddenRailCount > 0 ? (
        <button
          type="button"
          onClick={onOpenList}
          className="size-11 rounded-full bg-card text-xs font-bold text-muted-foreground shadow-xl shadow-black/10 ring-1 ring-border/50 transition-all hover:-translate-y-0.5 hover:text-foreground hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={t("dropdown.viewAll")}
          title={t("dropdown.viewAll")}
        >
          {hiddenRailCount > 9 ? "9+" : `+${hiddenRailCount}`}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onToggleList}
        className={cn(
          "relative size-14 rounded-full bg-card text-foreground shadow-2xl shadow-black/15 ring-1 ring-border/50 transition-all hover:-translate-y-0.5 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          listOpen && "ring-2 ring-primary",
        )}
        aria-label={t("title")}
        title={t("title")}
      >
        <MessageSquare className="mx-auto size-5" />
        {unreadConversations > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center ring-2 ring-background">
            {unreadConversations > 99 ? "99+" : unreadConversations}
          </span>
        ) : null}
      </button>
    </div>
  )
}
