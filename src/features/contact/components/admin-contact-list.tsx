"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Mail, MailCheck, MailOpen, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  closeContactSubmission,
  replyContactSubmission,
} from "../api/admin-actions"
import type { ContactSubmissionRow } from "../types"
import { AdminReplyDialog } from "./admin-reply-dialog"

const STATUS_BADGE: Record<
  string,
  { labelKey: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { labelKey: "status.pending", variant: "outline" },
  read: { labelKey: "status.read", variant: "secondary" },
  replied: { labelKey: "status.replied", variant: "default" },
  closed: { labelKey: "status.closed", variant: "destructive" },
}

export function AdminContactList({
  items,
}: {
  items: ContactSubmissionRow[]
}) {
  const t = useTranslations("admin.contactSubmissions")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [replyTarget, setReplyTarget] = useState<ContactSubmissionRow | null>(null)

  const handleClose = (id: number) => {
    startTransition(async () => {
      const result = await closeContactSubmission(id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(t("closed"))
      router.refresh()
    })
  }

  const handleReply = async (id: number, replyMessage: string) => {
    const result = await replyContactSubmission({ id, replyMessage })
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    toast.success(t("replied"))
    router.refresh()
    return true
  }

  const statusIcon = (status: string) => {
    if (status === "pending") return <Mail className="w-3.5 h-3.5" />
    if (status === "read") return <MailOpen className="w-3.5 h-3.5" />
    if (status === "replied") return <MailCheck className="w-3.5 h-3.5" />
    return <X className="w-3.5 h-3.5" />
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {t("empty")}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.pending
          return (
            <Card key={item.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      &lt;{item.email}&gt;
                    </span>
                    <Badge variant={badge.variant} className="text-[10px] gap-1">
                      {statusIcon(item.status)}
                      {t(badge.labelKey as never)}
                    </Badge>
                  </div>
                  {item.subject ? (
                    <p className="text-sm font-medium text-foreground/80">
                      {item.subject}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {item.message}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("vi-VN")}
                  </p>
                  {item.reply_message ? (
                    <div className="mt-2 pl-3 border-l-2 border-primary/30">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t("replyLabel")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {item.reply_message}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status !== "closed" && item.status !== "replied" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={pending}
                        onClick={() => setReplyTarget(item)}
                      >
                        {t("reply")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                        disabled={pending}
                        onClick={() => handleClose(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <AdminReplyDialog
        target={replyTarget}
        onClose={() => setReplyTarget(null)}
        onReply={handleReply}
      />
    </>
  )
}
