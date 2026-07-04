"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ChevronRight, PenSquare } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  useMessagingOverview,
  useUnreadConversationsCount,
} from "@/features/messaging/hooks"
import type { ConversationItem } from "@/features/messaging/types"
import { getInitials } from "@/lib/utils/format"
import { useEnsureConversation } from "@/features/messaging/hooks"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { translateMessagingError } from "@/features/messaging/lib/translate-error"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const fadeIn = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

const PREVIEW_LIMIT = 6

export function MessageDropdown({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("messages")
  const tErr = useTranslations("messages.errors")
  const [open, setOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadConversationsCount()
  const { data, isLoading } = useMessagingOverview(undefined, {
    enabled: open,
    limit: PREVIEW_LIMIT,
    staleTime: 10_000,
  })
  const formatRel = useRelativeTimeFormatter()
  const ensure = useEnsureConversation()
  const router = useRouter()

  const handleItemClick = (conv: ConversationItem) => {
    if (conv.conversationId != null) {
      router.push(`/messages?c=${conv.conversationId}`)
      return
    }
    ensure.mutate(conv.otherUserId, {
      onSuccess: (cid) => router.push(`/messages?c=${cid}`),
      onError: (err) => toast.error(translateMessagingError(tErr, err.message)),
    })
  }

  // Dropdown chỉ hiển thị các conversation thật (đã có tin), không kèm
  // placeholder connections — tránh nhiễu cho người đang xem nhanh inbox.
  const allItems = data?.items ?? []
  const items = allItems.slice(0, PREVIEW_LIMIT)
  const unreadConversations = data?.unreadConversations ?? unreadCount

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <span className="relative inline-flex">
          {children}
          {unreadConversations > 0 ? (
            <span className="absolute top-2 right-2 lg:right-3 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center pointer-events-none">
              {unreadConversations > 99 ? "99+" : unreadConversations}
            </span>
          ) : null}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 p-0 rounded-2xl bg-background/95 backdrop-blur-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
          <div>
            <h3 className="font-headline font-bold text-sm text-foreground">
              {t("title")}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t("dropdown.unreadSummary", { count: unreadConversations })}
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
          >
            <Link href="/network">
              <PenSquare className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl px-1 py-2"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-muted animate-pulse" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-full rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t("dropdown.empty")}
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {items.map((conv, index) => {
                const name = conv.displayName ?? "—"
                return (
                  <motion.div key={conv.conversationId} variants={fadeIn}>
                    <button
                      onClick={() => handleItemClick(conv)}
                      disabled={ensure.isPending && ensure.variables === conv.otherUserId}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${
                        index < items.length - 1
                          ? "border-b border-border/10"
                          : ""
                      } ${conv.unreadCount > 0 ? "bg-primary/[0.02]" : ""} ${ensure.isPending && ensure.variables === conv.otherUserId ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10 rounded-xl">
                          {conv.avatarUrl ? (
                            <AvatarImage src={conv.avatarUrl} alt={name} />
                          ) : null}
                          <AvatarFallback className="text-xs font-semibold">
                            {getInitials(name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-sm truncate ${
                              conv.unreadCount > 0
                                ? "font-bold text-foreground"
                                : "font-semibold text-foreground"
                            }`}
                          >
                            {name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {conv.lastCreatedAt
                              ? formatRel(conv.lastCreatedAt)
                              : ""}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate mt-0.5 ${
                            conv.unreadCount > 0
                              ? "text-foreground/80 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conv.lastContent ?? t("noMessages")}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>

        <Link
          href="/messages"
          className="flex items-center justify-center gap-1 px-4 py-3.5 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors border-t border-border/20 rounded-b-2xl group"
        >
          {t("dropdown.viewAll")}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
