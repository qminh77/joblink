"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  useEnsureConversation,
  useMessagingOverview,
  useUnreadConversationsCount,
} from "../../hooks"
import { translateMessagingError } from "../../lib/translate-error"
import type { ConversationItem } from "../../types"

import { DockChatWindow } from "../dock-chat-window"
import { ConversationListPanel } from "./conversation-list-panel"
import {
  BOTTOM_EDGE,
  GAP,
  HIDDEN_ROUTES,
  MAX_OPEN_WINDOWS,
  MAX_RAIL_ITEMS,
  RAIL_WIDTH,
  RIGHT_EDGE,
  WINDOW_WIDTH,
} from "./constants"
import { DockRail } from "./dock-rail"
import type { OpenWindow } from "./types"

/**
 * Dock messenger ở góc dưới-phải kiểu chat head: chỉ giữ các avatar tròn ở
 * trạng thái nghỉ, bấm vào mới mở cửa sổ chat nổi.
 */
export function MessagingDock() {
  const pathname = usePathname()
  const user = useCurrentUser()

  const [listOpen, setListOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([])
  const [idleReady, setIdleReady] = useState(false)
  const ensure = useEnsureConversation()
  const tErr = useTranslations("messages.errors")
  const { data: unreadCount = 0 } = useUnreadConversationsCount()
  const shouldLoadOverview = idleReady || listOpen || openWindows.length > 0
  const { data } = useMessagingOverview(undefined, {
    enabled: shouldLoadOverview,
    limit: 8,
    staleTime: 30_000,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setIdleReady(true), 1500)
    return () => window.clearTimeout(timer)
  }, [])

  const items = useMemo(() => data?.items ?? [], [data])
  const unreadConversations = data?.unreadConversations ?? unreadCount

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
        <ConversationListPanel
          conversations={filtered}
          listPanelRight={listPanelRight}
          openConversationIds={openWindowIds}
          pendingOtherUserId={ensure.isPending ? ensure.variables : undefined}
          query={query}
          unreadConversations={unreadConversations}
          onClose={() => setListOpen(false)}
          onQueryChange={setQuery}
          onSelectConversation={handleItemClick}
        />
      ) : null}

      <DockRail
        hiddenRailCount={hiddenRailCount}
        listOpen={listOpen}
        openConversationIds={openWindowIds}
        railItems={railItems}
        unreadConversations={unreadConversations}
        onOpenList={() => setListOpen(true)}
        onToggleConversation={toggleRailConversation}
        onToggleList={() => setListOpen((v) => !v)}
      />
    </>
  )
}
