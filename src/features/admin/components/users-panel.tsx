"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { Filter, Search, Shield, ShieldOff, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { applyUserAction } from "@/features/admin/api/users"
import type { AdminUserListResult, AdminUserRow } from "@/features/admin/types"
import { USER_ROLES, USER_STATUSES } from "@/lib/constants"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

const STATUS_STYLE: Record<string, string> = {
  pending_verification:
    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  active:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  suspended:
    "bg-amber-500/10 text-amber-600 border-amber-500/20",
  banned: "bg-red-500/10 text-red-600 border-red-500/20",
  deleted: "bg-muted text-muted-foreground border-border/30",
}

type Action = "suspend" | "ban" | "restore"

export function UsersPanel({
  initial,
  query,
}: {
  initial: AdminUserListResult
  query: {
    search?: string
    role?: string
    status?: string
    page?: number
  }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("admin.users")
  const tRoles = useTranslations("admin.users.roles")
  const tStatuses = useTranslations("admin.users.statuses")
  const tCommon = useTranslations("common")
  const format = useFormatter()

  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<
    { user: AdminUserRow; action: Action } | null
  >(null)
  const [reason, setReason] = useState("")

  const totalPages = Math.max(1, Math.ceil(initial.total / initial.pageSize))

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    if (key !== "page") next.delete("page")
    startTransition(() => router.replace(`/admin/users?${next.toString()}`))
  }

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  const goToPage = (page: number) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", String(page))
    startTransition(() => router.replace(`/admin/users?${next.toString()}`))
  }

  const submitAction = () => {
    if (!confirmTarget) return
    if (!reason.trim()) {
      toast.error(t("confirmReason"))
      return
    }
    startTransition(async () => {
      const result = await applyUserAction({
        userId: confirmTarget.user.id,
        action: confirmTarget.action,
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      const successKey =
        confirmTarget.action === "suspend"
          ? "success.suspended"
          : confirmTarget.action === "ban"
            ? "success.banned"
            : "success.restored"
      toast.success(t(successKey as never))
      setConfirmTarget(null)
      setReason("")
      router.refresh()
    })
  }

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <form
          onSubmit={onSearchSubmit}
          className="relative flex-1 max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
          />
        </form>
        <Select
          value={query.role ?? "all"}
          onValueChange={(v) => updateParam("role", v)}
        >
          <SelectTrigger className="w-40 rounded-lg">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            {USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {tRoles(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {USER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatuses(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {t("total", { count: initial.total })}
        </p>
      </div>

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("role")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("status")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("joined")}
                </th>
                <th className="text-right px-4 py-3 font-semibold">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {initial.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                initial.items.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link
                        href={profileHref(user.id, user.role)}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar className="w-8 h-8">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {getInitials(user.displayName, "JL")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary truncate">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {tRoles(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLE[user.status] ?? ""}`}
                      >
                        {tStatuses(user.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format.dateTime(new Date(user.createdAt), {
                        dateStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {user.status !== "banned" &&
                        user.role !== "admin" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                            onClick={() =>
                              setConfirmTarget({ user, action: "ban" })
                            }
                            title={t("actionBan")}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        ) : null}
                        {user.status === "active" &&
                        user.role !== "admin" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            className="h-8 w-8 p-0 rounded-lg text-amber-500 hover:bg-amber-500/10"
                            onClick={() =>
                              setConfirmTarget({ user, action: "suspend" })
                            }
                            title={t("actionSuspend")}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        ) : null}
                        {(user.status === "suspended" ||
                          user.status === "banned") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            className="h-8 w-8 p-0 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() =>
                              setConfirmTarget({ user, action: "restore" })
                            }
                            title={t("actionRestore")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {t("page", { page: initial.page, total: totalPages })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pending || initial.page <= 1}
            onClick={() => goToPage(initial.page - 1)}
          >
            {t("prev")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || initial.page >= totalPages}
            onClick={() => goToPage(initial.page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null)
            setReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget ? (
                <>
                  <strong>{t(`action${cap(confirmTarget.action)}` as never)}</strong>
                  {" — "}
                  {confirmTarget.user.displayName} ({confirmTarget.user.email})
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("confirmReason")}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !reason.trim()}
              onClick={(e) => {
                e.preventDefault()
                submitAction()
              }}
            >
              {pending ? t("submitting") : t("submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
