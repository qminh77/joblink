"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import type { ContactSubmissionRow } from "../types"

export function AdminReplyDialog({
  target,
  onClose,
  onReply,
}: {
  target: ContactSubmissionRow | null
  onClose: () => void
  onReply: (id: number, replyMessage: string) => Promise<boolean>
}) {
  const t = useTranslations("admin.contactSubmissions")
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!target || !message.trim()) return
    startTransition(async () => {
      const ok = await onReply(target.id, message.trim())
      if (ok) {
        setMessage("")
        onClose()
      }
    })
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) {
          setMessage("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("replyTitle")}</DialogTitle>
        </DialogHeader>
        {target ? (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">{target.name}</span>
                {" <"}
                {target.email}
                {">"}
              </p>
              {target.subject ? (
                <p className="text-muted-foreground">{target.subject}</p>
              ) : null}
              <p className="text-muted-foreground whitespace-pre-wrap text-xs mt-2">
                {target.message}
              </p>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t("replyPlaceholder")}
              className="rounded-lg resize-none"
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending || !message.trim()}
            className="rounded-lg"
          >
            {pending ? t("sending") : t("sendReply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
