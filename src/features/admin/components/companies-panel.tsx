"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Building2, Check, ExternalLink, Search, X } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { applyCompanyAction } from "@/features/admin/api/companies"
import type { AdminCompanyRow } from "@/features/admin/types"
import type { CompanyVerification } from "@/types/database"
import { getInitials } from "@/lib/utils/format"

type Action = "approve" | "reject" | "suspend" | "restore"

const TAB_STATUS: Record<string, CompanyVerification | "all"> = {
  pending: "pending",
  verified: "verified",
  rejected: "rejected",
  suspended: "suspended",
  all: "all",
}

export function CompaniesPanel({
  items,
  counts,
  query,
}: {
  items: AdminCompanyRow[]
  counts: Record<CompanyVerification | "all", number>
  query: { status?: string; search?: string }
}) {
  const t = useTranslations("admin.companies")
  const tStatuses = useTranslations("admin.companies.statuses")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const format = useFormatter()

  const [search, setSearch] = useState(query.search ?? "")
  const [confirmTarget, setConfirmTarget] = useState<
    { company: AdminCompanyRow; action: Action } | null
  >(null)
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const tab = query.status && TAB_STATUS[query.status] ? query.status : "pending"

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value === "all") next.delete("status")
    else next.set("status", value)
    startTransition(() =>
      router.replace(`/admin/companies?${next.toString()}`),
    )
  }

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = new URLSearchParams(searchParams.toString())
    if (search.trim()) next.set("q", search.trim())
    else next.delete("q")
    startTransition(() =>
      router.replace(`/admin/companies?${next.toString()}`),
    )
  }

  const submit = () => {
    if (!confirmTarget) return
    if (confirmTarget.action === "reject" && !note.trim()) {
      toast.error(t("note"))
      return
    }
    startTransition(async () => {
      const result = await applyCompanyAction({
        userId: confirmTarget.company.userId,
        action: confirmTarget.action,
        note: note.trim() || null,
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      const key =
        confirmTarget.action === "approve"
          ? "success.approved"
          : confirmTarget.action === "reject"
            ? "success.rejected"
            : confirmTarget.action === "suspend"
              ? "success.suspended"
              : "success.restored"
      toast.success(t(key as never))
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

      <form
        onSubmit={onSearchSubmit}
        className="relative max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
        />
      </form>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap">
          <TabsTrigger value="pending" className="rounded-lg text-sm px-3">
            {t("tabs.pending", { count: counts.pending ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="verified" className="rounded-lg text-sm px-3">
            {t("tabs.verified", { count: counts.verified ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg text-sm px-3">
            {t("tabs.rejected", { count: counts.rejected ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="suspended" className="rounded-lg text-sm px-3">
            {t("tabs.suspended", { count: counts.suspended ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg text-sm px-3">
            {t("tabs.all", { count: counts.all ?? 0 })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {items.length === 0 ? (
            <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            </Card>
          ) : (
            items.map((c) => (
              <Card
                key={c.userId}
                className="bg-card border-border/30 rounded-xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <Avatar className="w-12 h-12 rounded-xl">
                      {c.logoUrl ? <AvatarImage src={c.logoUrl} /> : null}
                      <AvatarFallback className="rounded-xl bg-primary/10">
                        {getInitials(c.name, "CO")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {c.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${verifColor(c.verificationStatus)}`}
                        >
                          {tStatuses(c.verificationStatus)}
                        </Badge>
                        <a
                          href={`/company/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                        >
                          {t("viewDetail")}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <DetailItem label={t("fields.taxId")} value={c.taxId} />
                        <DetailItem
                          label={t("fields.representative")}
                          value={c.representativeName}
                        />
                        <DetailItem
                          label={t("fields.businessEmail")}
                          value={c.businessEmail}
                        />
                        <DetailItem
                          label={t("fields.businessAddress")}
                          value={c.businessAddress}
                        />
                        <DetailItem
                          label={t("fields.industry")}
                          value={c.industry}
                        />
                        <DetailItem
                          label={t("fields.submitted")}
                          value={format.dateTime(new Date(c.submittedAt), {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        />
                      </dl>
                      {c.verificationNote ? (
                        <p className="mt-2 text-xs text-amber-600">
                          “{c.verificationNote}”
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(c.verificationStatus === "pending" ||
                      c.verificationStatus === "pending_update") && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                          disabled={pending}
                          onClick={() =>
                            setConfirmTarget({ company: c, action: "approve" })
                          }
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-red-500/30 text-red-500"
                          disabled={pending}
                          onClick={() =>
                            setConfirmTarget({ company: c, action: "reject" })
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t("reject")}
                        </Button>
                      </>
                    )}
                    {c.verificationStatus === "verified" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        disabled={pending}
                        onClick={() =>
                          setConfirmTarget({ company: c, action: "suspend" })
                        }
                      >
                        {t("suspend")}
                      </Button>
                    )}
                    {(c.verificationStatus === "rejected" ||
                      c.verificationStatus === "suspended") && (
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={pending}
                        onClick={() =>
                          setConfirmTarget({ company: c, action: "restore" })
                        }
                      >
                        {t("restore")}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

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
            <DialogTitle>
              {confirmTarget ? t(confirmTarget.action) : t("approve")}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget ? confirmTarget.company.name : ""}
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
              {pending ? t("submitting") : t("approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex gap-1">
      <dt className="font-medium text-foreground/80">{label}:</dt>
      <dd className="truncate">{value}</dd>
    </div>
  )
}

function verifColor(s: CompanyVerification): string {
  switch (s) {
    case "verified":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-600 border-red-500/20"
    case "suspended":
      return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
    default:
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }
}
