"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronUp, MessageSquare, Search, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import { useMessagingOverview } from "../hooks"
import type { ConversationItem } from "../types"

import { DockChatWindow } from "./dock-chat-window"

const MAX_OPEN_WINDOWS = 3
// Bar (w-72 = 288px) + right-4 (16px) = 304px tính từ phải.
// Mỗi window: w-80 (320px) + gap 8px.
const BAR_WIDTH = 288
const WINDOW_WIDTH = 320
const GAP = 8
const RIGHT_EDGE = 16

// Đường dẫn ẩn dock — /messages có UI riêng nên không hiện trùng.
const HIDDEN_ROUTES = ["/messages"]

type OpenWindow = {
  conversationId: number
  minimized: boolean
}

/**
 * Dock messenger ở góc dưới-phải (kiểu LinkedIn/Facebook). Cho phép xem danh
 * sách hội thoại + mở vài cửa sổ chat nổi mà không rời khỏi trang hiện tại.
 * Tái sử dụng hoàn toàn cache react-query với /messages.
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

  const items = useMemo(
    () => (data?.items ?? []).filter((c) => c.conversationId != null),
    [data],
  )
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

  const visibleOpenWindows = useMemo(
    () => openWindows.filter((window) => itemsById.has(window.conversationId)),
    [itemsById, openWindows],
  )

  const openConversation = useCallback((conversationId: number) => {
    setOpenWindows((prev) => {
      const liveWindows = prev.filter(
        (window) =>
          window.conversationId === conversationId ||
          itemsById.has(window.conversationId),
      )
      const existing = liveWindows.find(
        (window) => window.conversationId === conversationId,
      )
      if (existing) {
        return liveWindows.map((window) =>
          window.conversationId === conversationId
            ? { ...window, minimized: false }
            : window,
        )
      }
      const next = [{ conversationId, minimized: false }, ...liveWindows]
      return next.slice(0, MAX_OPEN_WINDOWS)
    })
    setListOpen(false)
  }, [itemsById])

  const closeWindow = useCallback((conversationId: number) => {
    setOpenWindows((prev) =>
      prev.filter((w) => w.conversationId !== conversationId),
    )
  }, [])

  const toggleMinimize = useCallback((conversationId: number) => {
    setOpenWindows((prev) =>
      prev.map((w) =>
        w.conversationId === conversationId
          ? { ...w, minimized: !w.minimized }
          : w,
      ),
    )
  }, [])

  if (HIDDEN_ROUTES.some((r) => pathname?.startsWith(r))) return null

  // Bar nằm sát phải; window thứ N (0-index) nằm bên trái bar, cách (BAR + N*(WINDOW+GAP)) px.
  const barRight = RIGHT_EDGE
  const firstWindowRight = RIGHT_EDGE + BAR_WIDTH + GAP

  return (
    <>
      {visibleOpenWindows.map((w, idx) => {
        const conv = itemsById.get(w.conversationId)
        if (!conv) return null
        const rightPx = firstWindowRight + idx * (WINDOW_WIDTH + GAP)
        return (
          <div
            key={w.conversationId}
            className="hidden lg:block fixed bottom-0 z-40"
            style={{ right: `${rightPx}px` }}
          >
            <DockChatWindow
              conversation={conv}
              currentUserId={user.id}
              minimized={w.minimized}
              onClose={() => closeWindow(w.conversationId)}
              onToggleMinimize={() => toggleMinimize(w.conversationId)}
            />
          </div>
        )
      })}

      <div
        className={`hidden lg:flex fixed bottom-0 z-40 w-72 bg-card border border-border/40 rounded-t-2xl shadow-2xl shadow-black/10 flex-col overflow-hidden transition-[height] duration-200 ${
          listOpen ? "h-[480px]" : "h-12"
        }`}
        style={{ right: `${barRight}px` }}
      >
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          className="flex items-center justify-between px-4 h-12 shrink-0 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="w-4 h-4 text-foreground" />
            <span className="font-headline font-bold text-sm">{t("title")}</span>
            {unreadConversations > 0 ? (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadConversations > 99 ? "99+" : unreadConversations}
              </span>
            ) : null}
          </div>
          <ChevronUp
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              listOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {listOpen ? (
          <>
            <div className="px-3 py-2 border-y border-border/30 shrink-0">
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
                  const isOpen = visibleOpenWindows.some(
                    (w) => w.conversationId === conv.conversationId,
                  )
                  return (
                    <button
                      key={conv.conversationId}
                      type="button"
                      onClick={() =>
                        openConversation(conv.conversationId as number)
                      }
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/10 last:border-b-0 cursor-pointer ${
                        isOpen ? "bg-primary/[0.04]" : ""
                      }`}
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
          </>
        ) : null}
      </div>
    </>
  )
}
