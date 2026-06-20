"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { MessageSquare, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { useEnsureConversation, useMessagingOverview } from "../hooks"
import { translateMessagingError } from "../lib/translate-error"
import type { ConversationItem } from "../types"

import { DockChatWindow } from "./dock-chat-window"

const MAX_OPEN_WINDOWS = 3
const MAX_RAIL_ITEMS = 6
const RAIL_WIDTH = 56
const WINDOW_WIDTH = 320
const GAP = 12
const RIGHT_EDGE = 16
const BOTTOM_EDGE = 16

// Đường dẫn ẩn dock: /messages có UI riêng nên không hiện trùng.
const HIDDEN_ROUTES = ["/messages"]

type OpenWindow = {
  conversationId: number
}

/**
 * Dock messenger ở góc dưới-phải kiểu chat head: chỉ giữ các avatar tròn ở
 * trạng thái nghỉ, bấm vào mới mở cửa sổ chat nổi.
 */
export function MessagingDock() {
  const t = useTranslations("messages")
  const pathname = usePathname()
  const user = useCurrentUser()
  const { data } = useMessagingOverview()
  const formatRel = useRelativeTimeFormatter()

  const [listOpen, setListOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([])
  const ensure = useEnsureConversation()
  const tErr = useTranslations("messages.errors")

  const items = useMemo(() => data?.items ?? [], [data])
  const unreadConversations = items.filter((c) => c.unreadCount > 0).length

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((c) =>
      (c.displayName ?? "").toLowerCase().includes(needle),
    )
  }, [items, query])

  const itemsById = useMemo(() => {
    const map = new Map<number, ConversationItem>()
    for (const c of items) {
      if (c.conversationId != null) map.set(c.conversationId, c)
    }
    return map
  }, [items])

  const railItems = useMemo(() => {
    const seen = new Set<number>()
    return items
      .filter((c) => c.conversationId != null)
      .filter((c) => {
        const id = c.conversationId as number
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      .slice(0, MAX_RAIL_ITEMS)
  }, [items])

  const visibleOpenWindows = useMemo(
    () => openWindows.filter((window) => itemsById.has(window.conversationId)),
    [itemsById, openWindows],
  )

  const openWindowIds = useMemo(
    () => new Set(visibleOpenWindows.map((window) => window.conversationId)),
    [visibleOpenWindows],
  )

  const hiddenRailCount = Math.max(
    0,
    items.filter((c) => c.conversationId != null).length - railItems.length,
  )

  const openConversation = useCallback((conversationId: number) => {
    setOpenWindows((prev) => {
      const liveWindows = prev.filter(
        (window) =>
          window.conversationId === conversationId ||
          itemsById.has(window.conversationId),
      )
      const existing = liveWindows.some(
        (window) => window.conversationId === conversationId,
      )
      if (existing) return liveWindows

      const next = [{ conversationId }, ...liveWindows]
      return next.slice(0, MAX_OPEN_WINDOWS)
    })
    setListOpen(false)
  }, [itemsById])

  const handleItemClick = useCallback((conv: ConversationItem) => {
    if (conv.conversationId != null) {
      openConversation(conv.conversationId)
      return
    }

    ensure.mutate(conv.otherUserId, {
      onSuccess: (cid) => openConversation(cid),
      onError: (err) => toast.error(translateMessagingError(tErr, err.message)),
    })
  }, [ensure, openConversation, tErr])

  const closeWindow = useCallback((conversationId: number) => {
    setOpenWindows((prev) =>
      prev.filter((w) => w.conversationId !== conversationId),
    )
  }, [])

  const toggleRailConversation = useCallback((conv: ConversationItem) => {
    if (conv.conversationId == null) return
    if (openWindowIds.has(conv.conversationId)) {
      closeWindow(conv.conversationId)
      return
    }
    openConversation(conv.conversationId)
  }, [closeWindow, openConversation, openWindowIds])

  if (HIDDEN_ROUTES.some((r) => pathname?.startsWith(r))) return null

  const firstPanelRight = RIGHT_EDGE + RAIL_WIDTH + GAP
  const listPanelRight =
    firstPanelRight + visibleOpenWindows.length * (WINDOW_WIDTH + GAP)

  return (
    <>
      {visibleOpenWindows.map((w, idx) => {
        const conv = itemsById.get(w.conversationId)
        if (!conv) return null
        const rightPx = firstPanelRight + idx * (WINDOW_WIDTH + GAP)
        return (
          <div
            key={w.conversationId}
            className="hidden lg:block fixed z-40"
            style={{ right: `${rightPx}px`, bottom: `${BOTTOM_EDGE}px` }}
          >
            <DockChatWindow
              conversation={conv}
              currentUserId={user.id}
              minimized={false}
              onClose={() => closeWindow(w.conversationId)}
              onToggleMinimize={() => closeWindow(w.conversationId)}
            />
          </div>
        )
      })}

      {listOpen ? (
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
              onClick={() => setListOpen(false)}
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-muted/60 rounded-full pl-8 pr-8 py-1.5 text-[13px] outline-none focus:ring-1 focus:ring-primary"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted-foreground/20 text-muted-foreground cursor-pointer"
                  aria-label={t("dock.clearSearch")}
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {query.trim() ? t("listEmpty") : t("dropdown.empty")}
              </div>
            ) : (
              filtered.map((conv) => {
                const name = conv.displayName ?? "—"
                const isOpen =
                  conv.conversationId != null &&
                  openWindowIds.has(conv.conversationId)
                return (
                  <button
                    key={conv.conversationId ?? `user-${conv.otherUserId}`}
                    type="button"
                    onClick={() => handleItemClick(conv)}
                    disabled={
                      ensure.isPending && ensure.variables === conv.otherUserId
                    }
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/10 last:border-b-0 cursor-pointer",
                      isOpen && "bg-primary/[0.04]",
                      ensure.isPending &&
                        ensure.variables === conv.otherUserId &&
                        "opacity-50 pointer-events-none",
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
                            conv.unreadCount > 0
                              ? "font-bold"
                              : "font-semibold"
                          }`}
                        >
                          {name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conv.lastCreatedAt
                            ? formatRel(conv.lastCreatedAt)
                            : ""}
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
            onClick={() => setListOpen(false)}
          >
            {t("dropdown.viewAll")}
          </Link>
        </div>
      ) : null}

      <div
        className="hidden lg:flex fixed right-4 bottom-4 z-50 flex-col items-center gap-3"
        aria-label={t("title")}
      >
        {railItems.map((conv) => {
          const name = conv.displayName ?? "—"
          const isOpen =
            conv.conversationId != null && openWindowIds.has(conv.conversationId)
          return (
            <button
              key={conv.conversationId ?? `rail-${conv.otherUserId}`}
              type="button"
              onClick={() => toggleRailConversation(conv)}
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
            onClick={() => setListOpen(true)}
            className="size-11 rounded-full bg-card text-xs font-bold text-muted-foreground shadow-xl shadow-black/10 ring-1 ring-border/50 transition-all hover:-translate-y-0.5 hover:text-foreground hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("dropdown.viewAll")}
            title={t("dropdown.viewAll")}
          >
            {hiddenRailCount > 9 ? "9+" : `+${hiddenRailCount}`}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
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
    </>
  )
}
