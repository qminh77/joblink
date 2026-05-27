"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Check, CheckCheck, ChevronDown, Send, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

import {
  useActiveConversation,
  useConversationMessages,
  useMarkConversationRead,
  useSendMessage,
} from "../hooks"
import type { ConversationItem } from "../types"

type Props = {
  conversation: ConversationItem
  currentUserId: number
  minimized: boolean
  onClose: () => void
  onToggleMinimize: () => void
}

/**
 * Cửa sổ chat nổi (compact ~320×420) cho dock messenger. Tái sử dụng cùng
 * hooks như /messages nên realtime + cache hoạt động đồng bộ — đóng cửa sổ
 * này không mất state, mở /messages thấy y nguyên.
 */
export function DockChatWindow({
  conversation,
  currentUserId,
  minimized,
  onClose,
  onToggleMinimize,
}: Props) {
  const t = useTranslations("messages")
  const tErr = useTranslations("messages.errors")
  const formatRel = useRelativeTimeFormatter()

  const conversationId = conversation.conversationId as number
  // Chỉ "active" (suppress toast) khi cửa sổ đang mở rộng, không phải khi
  // đã thu nhỏ — user vẫn cần được nhắc bằng toast nếu tin mới đến.
  useActiveConversation(minimized ? null : conversationId)

  const { data, isLoading } = useConversationMessages(conversationId)
  const messages = data?.items ?? []

  const send = useSendMessage(currentUserId)
  const markRead = useMarkConversationRead()

  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastReadIdRef = useRef<number | null>(null)
  const stickToBottomRef = useRef(true)

  const lastMessage = messages.at(-1) ?? null
  const lastMessageId = lastMessage?.id ?? null
  const lastSenderId = lastMessage?.senderId ?? null

  useEffect(() => {
    if (minimized) return
    if (lastMessageId == null) return
    if (lastMessageId === lastReadIdRef.current) return

    const isFirstLoad = lastReadIdRef.current === null
    const isNewIncoming = lastSenderId !== currentUserId && !isFirstLoad
    lastReadIdRef.current = lastMessageId

    if (isFirstLoad && conversation.unreadCount > 0) {
      markRead.mutate(conversationId)
    } else if (isNewIncoming) {
      markRead.mutate(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conversationId,
    lastMessageId,
    lastSenderId,
    currentUserId,
    minimized,
  ])

  useEffect(() => {
    lastReadIdRef.current = null
    stickToBottomRef.current = true
  }, [conversationId])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 120
  }, [])

  useEffect(() => {
    if (minimized) return
    const el = scrollRef.current
    if (!el) return
    if (stickToBottomRef.current || lastSenderId === currentUserId) {
      el.scrollTop = el.scrollHeight
      stickToBottomRef.current = true
    }
  }, [messages.length, conversationId, lastSenderId, currentUserId, minimized])

  const canSend = useMemo(() => {
    if (!conversation.isConnected) return false
    if (conversation.blockedByMe || conversation.blockedMe) return false
    return draft.trim().length > 0 && !send.isPending
  }, [conversation, draft, send.isPending])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    const content = draft.trim()
    setDraft("")
    send.mutate({ conversationId, content })
  }

  const otherName = conversation.displayName ?? "—"
  const otherProfileHref = profileHref(conversation.otherUserId, conversation.role)
  const hasUnread = !minimized ? false : conversation.unreadCount > 0

  return (
    <div
      className={`w-80 ${
        minimized ? "h-12" : "h-[420px]"
      } bg-card border border-border/40 rounded-t-2xl shadow-2xl shadow-black/10 flex flex-col overflow-hidden transition-all duration-200`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 shrink-0">
        <button
          type="button"
          onClick={onToggleMinimize}
          className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 text-left"
        >
          <div className="relative shrink-0">
            <Avatar className="w-8 h-8">
              {conversation.avatarUrl ? (
                <AvatarImage src={conversation.avatarUrl} alt={otherName} />
              ) : null}
              <AvatarFallback>{getInitials(otherName)}</AvatarFallback>
            </Avatar>
            {hasUnread ? (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{otherName}</p>
            {!minimized && conversation.headline ? (
              <p className="text-[10px] text-muted-foreground truncate">
                {conversation.headline}
              </p>
            ) : null}
          </div>
        </button>
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label={minimized ? t("dock.expand") : t("dock.minimize")}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                minimized ? "rotate-180" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label={t("dock.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized ? (
        <>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-1.5 overscroll-contain"
          >
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className={`h-7 ${
                      i % 2 ? "w-3/5 ml-auto" : "w-2/5"
                    } rounded-2xl`}
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-muted-foreground">
                <Link
                  href={otherProfileHref}
                  className="font-semibold text-foreground hover:text-primary block mb-1"
                >
                  {otherName}
                </Link>
                {t("startConversation")}
              </div>
            ) : (
              <div className="space-y-1.5">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUserId
                  const prev = messages[i - 1]
                  const showTime =
                    !prev ||
                    new Date(msg.createdAt).getTime() -
                      new Date(prev.createdAt).getTime() >
                      5 * 60 * 1000
                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center text-[9px] text-muted-foreground py-1">
                          {formatRel(msg.createdAt)}
                        </div>
                      )}
                      <div
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="max-w-[80%]">
                          <div
                            className={`rounded-2xl px-3 py-1.5 text-[13px] inline-block whitespace-pre-wrap break-words ${
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted border border-border/40 rounded-bl-md"
                            }`}
                          >
                            {msg.content}
                          </div>
                          {isMe && (
                            <div className="flex items-center justify-end gap-1 mt-0.5 px-1">
                              {msg.readAt ? (
                                <CheckCheck className="w-2.5 h-2.5 text-primary" />
                              ) : (
                                <Check className="w-2.5 h-2.5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-2 border-t border-border/40 shrink-0 flex items-center gap-1.5"
          >
            <div className="flex-1 flex items-center bg-muted rounded-full px-3 focus-within:ring-1 focus-within:ring-primary transition-all">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
                enterKeyHint="send"
                placeholder={
                  conversation.blockedByMe
                    ? tErr("blockedByMe")
                    : conversation.blockedMe
                      ? tErr("blockedMe")
                      : !conversation.isConnected
                        ? tErr("notConnected")
                        : t("inputPlaceholder")
                }
                disabled={
                  !conversation.isConnected ||
                  conversation.blockedByMe ||
                  conversation.blockedMe
                }
                className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] py-2 outline-none disabled:cursor-not-allowed"
                maxLength={4000}
              />
            </div>
            <button
              type="submit"
              disabled={!canSend}
              className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label={t("send")}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      ) : null}
    </div>
  )
}
