"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { modalContent, modalOverlay } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import {
  ensureConversationWithAction,
  sendMessageAction,
} from "@/features/messaging/api/actions"
import {
  MESSAGING_OVERVIEW_KEY,
  MESSAGING_UNREAD_KEY,
} from "@/features/messaging/hooks"
import { translateMessagingError } from "@/features/messaging/lib/translate-error"
import { useNetworkOverview } from "@/features/network/hooks"

export function JobSendModal({
  jobId,
  jobTitle,
  companyName,
  open,
  onClose,
}: {
  jobId: number
  jobTitle: string
  companyName: string
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <JobSendModalInner
      key={jobId}
      jobId={jobId}
      jobTitle={jobTitle}
      companyName={companyName}
      onClose={onClose}
    />
  )
}

function JobSendModalInner({
  jobId,
  jobTitle,
  companyName,
  onClose,
}: {
  jobId: number
  jobTitle: string
  companyName: string
  onClose: () => void
}) {
  const tPosts = useTranslations("posts")
  const tFeed = useTranslations("feed")
  const tErr = useTranslations("messages.errors")
  const qc = useQueryClient()

  const { data: overview, isLoading } = useNetworkOverview()
  const connections = overview?.connections

  const [query, setQuery] = useState("")
  const [note, setNote] = useState("")
  const [sentIds, setSentIds] = useState<Set<number>>(new Set())
  const [pendingId, setPendingId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const items = connections ?? []
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((c) => {
      const name = c.displayName.toLowerCase()
      const headline = (c.headline ?? "").toLowerCase()
      return name.includes(q) || headline.includes(q)
    })
  }, [connections, query])

  async function handleSend(userId: number) {
    if (pendingId != null || sentIds.has(userId)) return
    setPendingId(userId)
    try {
      const ensured = await ensureConversationWithAction(userId)
      if (!ensured.ok) {
        toast.error(translateMessagingError(tErr, ensured.error))
        return
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : ""
      const url = `${origin}/jobs/${jobId}`
      const trimmedNote = note.trim()
      const header = `${jobTitle} - ${companyName}`
      const content = trimmedNote
        ? `${trimmedNote}\n\n${header}\n${url}`
        : `${header}\n${url}`
      const res = await sendMessageAction(ensured.conversationId, content)
      if (!res.ok) {
        toast.error(translateMessagingError(tErr, res.error))
        return
      }
      setSentIds((prev) => {
        const next = new Set(prev)
        next.add(userId)
        return next
      })
      qc.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
      qc.invalidateQueries({ queryKey: MESSAGING_UNREAD_KEY })
      toast.success(tPosts("sendSuccess"))
    } catch (err) {
      toast.error(
        translateMessagingError(
          tErr,
          err instanceof Error ? err.message : null,
        ),
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="send-overlay"
        variants={modalOverlay}
        initial="hidden"
        animate="show"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          variants={modalContent}
          initial="hidden"
          animate="show"
          exit="exit"
          className="w-full max-w-sm bg-card border border-border/40 rounded-[24px] shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <h2 className="font-headline font-bold text-lg">
              {tPosts("sendViaMessage")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pt-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tPosts("sendNotePlaceholder")}
              rows={2}
              maxLength={2000}
              className="w-full text-sm bg-muted/40 border border-border/40 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="p-4 pt-3 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tPosts("searchPersonPlaceholder")}
                className="w-full bg-muted border border-border/40 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="p-2 max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8 px-4">
                {(connections?.length ?? 0) === 0
                  ? tPosts("sendEmpty")
                  : tPosts("sendNoMatch")}
              </p>
            ) : (
              filtered.map((connection) => {
                const isSent = sentIds.has(connection.userId)
                const isPending = pendingId === connection.userId
                return (
                  <div
                    key={connection.userId}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-8 h-8 shrink-0">
                        {connection.avatarUrl ? (
                          <AvatarImage src={connection.avatarUrl} />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(connection.displayName, "JL")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {connection.displayName}
                        </p>
                        {connection.headline ? (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {connection.headline}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant={isSent ? "secondary" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-lg shrink-0"
                      disabled={isPending || isSent}
                      onClick={() => handleSend(connection.userId)}
                    >
                      {isSent ? (
                        <>
                          <Check className="w-3 h-3" />
                          {tPosts("sendActionSent")}
                        </>
                      ) : isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {tPosts("sendActionSending")}
                        </>
                      ) : (
                        tFeed("send")
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
