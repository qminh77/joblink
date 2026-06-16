"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { ExternalLink, FileText, RotateCcw, Search, Trash2, EyeOff } from "lucide-react"
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
import { applyPostAction, type AdminPostRow } from "@/features/admin/api/posts"
import { POST_TYPES } from "@/lib/constants"

const TYPE_STYLE: Record<string, string> = {
  text: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  image: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  video: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  article: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  poll: "bg-amber-500/10 text-amber-600 border-amber-500/20",
}

const VISIBILITY_STYLE: Record<string, string> = {
  public: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  connections: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  private: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  hidden: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  deleted: "bg-red-500/10 text-red-600 border-red-500/20",
}

type Action = "hide" | "restore" | "delete"

const POST_STATUSES = ["active", "hidden"] as const

export function PostsPanel({
  items,
  query,
}: {
  items: AdminPostRow[]
  query: { type?: string; status?: string; search?: string }
}) {
  const t = useTranslations("admin.posts")
  const tTypes = useTranslations("admin.posts.types")
  const tStatuses = useTranslations("admin.posts.statuses")
  const tVisibility = useTranslations("admin.posts.visibilityLabel")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const format = useFormatter()

  const [search, setSearch] = useState(query.search ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<
    { post: AdminPostRow; action: Action } | null
  >(null)
  const [reason, setReason] = useState("")

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/posts?${next.toString()}`))
  }

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  const submit = () => {
    if (!confirmTarget) return
    if (!reason.trim()) {
      toast.error(t("reason"))
      return
    }
    startTransition(async () => {
      const result = await applyPostAction({
        postId: confirmTarget.post.id,
        action: confirmTarget.action,
        reason: reason.trim(),
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }
      toast.success(
        confirmTarget.action === "hide"
          ? t("success.hidden")
          : confirmTarget.action === "restore"
            ? t("success.restored")
            : t("success.deleted"),
      )
      setConfirmTarget(null)
      setReason("")
      router.refresh()
    })
  }

  const getActionIcon = (action: Action) => {
    switch (action) {
      case "hide": return <EyeOff className="w-4 h-4" />
      case "restore": return <RotateCcw className="w-4 h-4" />
      case "delete": return <Trash2 className="w-4 h-4" />
    }
  }

  const getActionButtonProps = (post: AdminPostRow) => {
    const buttons: { action: Action; title: string; className: string }[] = []

    if (post.status === "hidden") {
      buttons.push({
        action: "restore",
        title: t("restore"),
        className: "text-emerald-500 hover:bg-emerald-500/10",
      })
    } else {
      buttons.push({
        action: "hide",
        title: t("hide"),
        className: "text-amber-500 hover:bg-amber-500/10",
      })
    }

    buttons.push({
      action: "delete",
      title: t("delete"),
      className: "text-red-500 hover:bg-red-500/10",
    })

    return buttons
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
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
          value={query.type ?? "all"}
          onValueChange={(v) => updateParam("type", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            {POST_TYPES.map((s) => (
              <SelectItem key={s} value={s}>
                {tTypes(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.status ?? "all"}
          onValueChange={(v) => updateParam("status", v)}
        >
          <SelectTrigger className="w-44 rounded-lg">
            <SelectValue placeholder={t("filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            {POST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {tStatuses(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">
          {t("total", { count: items.length })}
        </p>
      </div>

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-4 py-3 font-semibold">Content</th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("filterType")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("author")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("visibility")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("filterStatus")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("reactions")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("comments")}
                </th>
                <th className="text-left px-4 py-3 font-semibold">
                  {t("createdAt")}
                </th>
                <th className="text-right px-4 py-3 font-semibold">
                  {t("open")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {items.length === 0 ? (
                <tr>
                    <td
                      colSpan={9}
                      className="text-center text-muted-foreground py-12"
                    >
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                items.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">
                      {post.content.substring(0, 120)}
                      {post.content.length > 120 ? "..." : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${TYPE_STYLE[post.postType] ?? TYPE_STYLE.text}`}
                      >
                        {tTypes(post.postType)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.authorName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${VISIBILITY_STYLE[post.visibility] ?? VISIBILITY_STYLE.public}`}
                      >
                        {tVisibility(post.visibility)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_STYLE[post.status] ?? STATUS_STYLE.active}`}
                      >
                        {tStatuses(post.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {post.reactionCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {post.commentCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format.dateTime(new Date(post.createdAt), {
                        dateStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/profile/${post.authorId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary"
                          title={t("open")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {getActionButtonProps(post).map((btn) => (
                          <Button
                            key={btn.action}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 rounded-lg ${btn.className}`}
                            disabled={pending}
                            onClick={() =>
                              setConfirmTarget({ post, action: btn.action })
                            }
                            title={btn.title}
                          >
                            {getActionIcon(btn.action)}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
              {confirmTarget
                ? `${confirmTarget.action === "hide" ? t("hide") : confirmTarget.action === "restore" ? t("restore") : t("delete")} — ${confirmTarget.post.content.substring(0, 100)}${confirmTarget.post.content.length > 100 ? "..." : ""}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !reason.trim()}
              onClick={(e) => {
                e.preventDefault()
                submit()
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
