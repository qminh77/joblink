"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { formatRelativeTime, getInitials } from "@/lib/utils/format"
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

  // ChatPanel chỉ được render khi user chọn 1 conversation đã tồn tại — nên
  // conversationId ở đây bao giờ cũng là số. TS chưa thu hẹp được vì type
  // gốc cho phép null (placeholder), assert tại điểm vào duy nhất.
  const conversationId = conversation.conversationId as number
  useActiveConversation(conversationId)

  const { data, isLoading } = useConversationMessages(conversationId)
  const messages = data?.items ?? []

  const send = useSendMessage(currentUserId)
  const markRead = useMarkConversationRead()

  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Mark read khi mở convo + mỗi khi có tin mới đến (nếu user đang xem)
  const lastMessageId = messages.at(-1)?.id ?? null
  useEffect(() => {
    if (conversation.unreadCount > 0 || lastMessageId != null) {
      markRead.mutate(conversationId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, lastMessageId])

  // Auto-scroll xuống đáy khi list đổi
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, conversationId])

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
  const profileHref = `/profile/${conversation.otherUserId}`

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
          <Link href={profileHref}>
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
              href={profileHref}
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
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
                      {formatRelativeTime(msg.createdAt)}
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
        className="p-3 border-t border-border/40 shrink-0 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center bg-muted rounded-full px-4 focus-within:ring-1 focus-within:ring-primary transition-all">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
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
