"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreHorizontal,
  Send,
} from "lucide-react"

import { btnTap, fadeUp, staggerSm } from "@/lib/animations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"
import { Skeleton } from "@/components/ui/skeleton"

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
  onBack: () => void
}

export function ChatPanel({ conversation, currentUserId, onBack }: Props) {
  const t = useTranslations("messages")
  const tErr = useTranslations("messages.errors")
  const formatRel = useRelativeTimeFormatter()

  // Placeholder mode: user vừa click 1 connection chưa có conversation. Server
  // action `ensure` đang chạy ở parent — ta vẫn render panel ngay (header +
  // skeleton + composer disabled) để cảm giác phản hồi tức thời, không phải
  // đợi 700-900ms RPC mới thấy gì.
  const conversationId = conversation.conversationId
  const isOpening = conversationId == null
  useActiveConversation(conversationId)

  const { data, isLoading: isLoadingMessages } = useConversationMessages(
    conversationId,
  )
  const messages = data?.items ?? []
  const isLoading = isOpening || isLoadingMessages

  const send = useSendMessage(currentUserId)
  const markRead = useMarkConversationRead()

  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  // Ghi nhớ message cuối đã được mark-read để tránh gọi mutate trùng lặp khi
  // chính user gửi tin (lastMessageId tăng nhưng không có gì để đánh dấu).
  const lastReadIdRef = useRef<number | null>(null)
  // Ghi nhớ "user đang ở gần bottom" để chỉ auto-scroll khi họ thật sự đang
  // theo dõi cuộc trò chuyện — tránh giật lên xuống khi user đang scroll lên
  // đọc tin cũ.
  const stickToBottomRef = useRef(true)

  const lastMessage = messages.at(-1) ?? null
  const lastMessageId = lastMessage?.id ?? null
  const lastSenderId = lastMessage?.senderId ?? null

  // Mark read khi: (1) lần đầu mở convo và có unread, (2) có tin mới từ
  // người kia đến trong lúc đang xem. Không gọi khi mới tự gửi tin.
  useEffect(() => {
    if (conversationId == null) return
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
  }, [conversationId, lastMessageId, lastSenderId, currentUserId])

  // Reset bookmark khi đổi conversation.
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

  // Auto-scroll xuống đáy: chỉ khi user đang ở gần bottom hoặc đổi convo.
  // Đồng thời, tin mình tự gửi luôn cuộn xuống (UX chat thông thường).
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (stickToBottomRef.current || lastSenderId === currentUserId) {
      el.scrollTop = el.scrollHeight
      stickToBottomRef.current = true
    }
  }, [messages.length, conversationId, lastSenderId, currentUserId])

  const canSend = useMemo(() => {
    if (conversationId == null) return false
    if (!conversation.isConnected) return false
    if (conversation.blockedByMe || conversation.blockedMe) return false
    return draft.trim().length > 0 && !send.isPending
  }, [conversationId, conversation, draft, send.isPending])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend || conversationId == null) return
    const content = draft.trim()
    setDraft("")
    send.mutate({ conversationId, content })
  }

  const otherName = conversation.displayName ?? "—"
  const otherProfileHref = profileHref(conversation.otherUserId, conversation.role)

  return (
    <>
      <div className="flex items-center justify-between p-3 px-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden p-1 hover:bg-muted rounded-full"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={otherProfileHref}>
            <Avatar className="w-9 h-9 cursor-pointer hover:opacity-80">
              {conversation.avatarUrl ? (
                <AvatarImage
                  src={conversation.avatarUrl}
                  alt={otherName}
                />
              ) : null}
              <AvatarFallback>{getInitials(otherName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <Link
              href={otherProfileHref}
              className="font-semibold text-sm hover:text-primary transition-colors truncate block"
            >
              {otherName}
            </Link>
            <span className="text-[11px] text-muted-foreground truncate">
              {conversation.headline ?? ""}
            </span>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`h-9 ${i % 2 ? "w-3/5 ml-auto" : "w-2/5"} rounded-2xl`}
              />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            {t("startConversation")}
          </div>
        ) : (
          <motion.div
            variants={staggerSm}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
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
                    <div className="text-center text-[10px] text-muted-foreground py-1">
                      {formatRel(msg.createdAt)}
                    </div>
                  )}
                  <motion.div
                    variants={fadeUp}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[75%] sm:max-w-[60%]">
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm inline-block whitespace-pre-wrap break-words ${
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
                            <CheckCheck className="w-3 h-3 text-primary" />
                          ) : (
                            <Check className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </motion.div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border/40 shrink-0 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center bg-muted rounded-full px-4 focus-within:ring-1 focus-within:ring-primary transition-all">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="send"
            placeholder={
              isOpening
                ? t("opening")
                : conversation.blockedByMe
                  ? tErr("blockedByMe")
                  : conversation.blockedMe
                    ? tErr("blockedMe")
                    : !conversation.isConnected
                      ? tErr("notConnected")
                      : t("inputPlaceholder")
            }
            disabled={
              isOpening ||
              !conversation.isConnected ||
              conversation.blockedByMe ||
              conversation.blockedMe
            }
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 outline-none disabled:cursor-not-allowed"
            maxLength={4000}
          />
        </div>
        <motion.button
          type="submit"
          disabled={!canSend}
          {...btnTap}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label={t("send")}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </form>
    </>
  )
}
