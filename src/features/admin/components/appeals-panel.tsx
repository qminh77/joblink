"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Check, Gavel, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  applyAppealAction,
  type AdminAppealRow,
} from "@/features/admin/api/appeals"
import type { AppealStatus } from "@/types/database"

const STATUSES: AppealStatus[] = ["pending", "accepted", "rejected"]

const STATUS_STYLE: Record<AppealStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
}

type Action = "accept" | "reject"

export function AppealsPanel({
  items,
  query,
}: {
  items: AdminAppealRow[]
  query: { status?: string }
}) {
  const t = useTranslations("admin.appeals")
  const tStatuses = useTranslations("admin.appeals.statuses")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const format = useFormatter()

  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<
    { appeal: AdminAppealRow; action: Action } | null
  >(null)
  const [note, setNote] = useState("")

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/appeals?${next.toString()}`))
  }

  const submit = () => {
    if (!confirmTarget) return
    startTransition(async () => {
      const result = await applyAppealAction({
        appealId: confirmTarget.appeal.id,
        action: confirmTarget.action,
        note: note.trim() || null,
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(
        confirmTarget.action === "accept"
          ? t("success.accepted")
          : t("success.rejected"),
      )
      setConfirmTarget(null)
      setNote("")
      router.refresh()
    })
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex items-center gap-3">
        <Select
          value={query.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatuses(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("total", { count: items.length })}
        </p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
            <Gavel className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </Card>
        ) : (
          items.map((a) => (
            <Card
              key={a.id}
              className="bg-card border-border/30 rounded-xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {a.appellantName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_STYLE[a.status]}`}
                    >
                      {tStatuses(a.status)}
                    </Badge>
                    {a.reportId ? (
                      <span className="text-xs text-muted-foreground">
                        report#{a.reportId}
                      </span>
                    ) : null}
                    {a.moderationActionId ? (
                      <span className="text-xs text-muted-foreground">
                        action#{a.moderationActionId}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm text-foreground whitespace-pre-line">
                    {a.reason}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground flex gap-3 flex-wrap">
                    <span>
                      {format.dateTime(new Date(a.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    {a.reviewedAt ? (
                      <span>
                        {t("reviewed")}:{" "}
                        {format.dateTime(new Date(a.reviewedAt), {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    ) : null}
                  </div>
                </div>
                {a.status === "pending" ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                      disabled={pending}
                      onClick={() => {
                        setConfirmTarget({ appeal: a, action: "accept" })
                        setNote("")
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-red-500/30 text-red-500"
                      disabled={pending}
                      onClick={() => {
                        setConfirmTarget({ appeal: a, action: "reject" })
                        setNote("")
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t("reject")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null)
            setNote("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? confirmTarget.action === "accept"
                  ? t("accept")
                  : t("reject")
                : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setConfirmTarget(null)
                setNote("")
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
