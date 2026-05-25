"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Send } from "lucide-react"

import { pageEntrance, slideLeft } from "@/lib/animations"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useEnsureConversation, useMessagingOverview } from "../hooks"
import { translateMessagingError } from "../lib/translate-error"
import type { ConversationItem, MessagingOverview } from "../types"
import { ChatPanel } from "./chat-panel"
import { ConversationList } from "./conversation-list"
import { toast } from "sonner"

type Props = {
  initialOverview: MessagingOverview
}

export function MessagingPageClient({ initialOverview }: Props) {
  const t = useTranslations("messages")
  const tErr = useTranslations("messages.errors")
  const user = useCurrentUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  const { data } = useMessagingOverview(initialOverview)
  const items = data?.items ?? []
  const ensure = useEnsureConversation()

  // selectedId là derived từ URL (?c=...). Mobile-list-view là local UI state.
  const urlId = searchParams.get("c")
  const selectedId = (() => {
    if (!urlId) return null
    const parsed = Number(urlId)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  })()
  const [showMobileList, setShowMobileList] = useState(selectedId == null)

  const selected =
    items.find((c) => c.conversationId === selectedId) ?? null

  const handleSelect = (conv: ConversationItem) => {
    setShowMobileList(false)

    const navigate = (cid: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("c", String(cid))
      router.replace(`/messages?${params.toString()}`, { scroll: false })
    }

    if (conv.conversationId != null) {
      navigate(conv.conversationId)
      return
    }

    // Placeholder cho connection chưa có conversation: tạo rồi mở.
    ensure.mutate(conv.otherUserId, {
      onSuccess: navigate,
      onError: (err) => {
        toast.error(translateMessagingError(tErr, err.message))
      },
    })
  }

  const handleBack = () => {
    setShowMobileList(true)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("c")
    const qs = params.toString()
    router.replace(`/messages${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="h-[calc(100vh-7rem)] flex gap-0"
    >
      <motion.div
        variants={slideLeft}
        initial="hidden"
        animate="show"
        className={`${
          selected && !showMobileList ? "hidden" : "flex"
        } md:flex w-full md:w-80 lg:w-96 shrink-0 flex-col bg-card border border-border/40 rounded-2xl overflow-hidden`}
      >
        <ConversationList
          items={items}
          activeId={selectedId}
          onSelect={handleSelect}
          pendingOtherUserId={ensure.isPending ? ensure.variables ?? null : null}
        />
      </motion.div>

      <div
        className={`${
          !selected || showMobileList ? "hidden md:flex" : "flex"
        } flex-1 flex-col bg-card border border-border/40 rounded-2xl overflow-hidden ml-0 md:ml-3`}
      >
        {selected ? (
          <ChatPanel
            conversation={selected}
            currentUserId={user.id}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-headline font-bold text-lg text-foreground">
              {t("emptyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("emptyDesc")}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
