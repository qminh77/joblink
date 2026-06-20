"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { applyPostAction, type AdminPostRow } from "../../api/posts"
import type { PostModerationAction } from "./constants"

type ConfirmTarget = {
  post: AdminPostRow
  action: PostModerationAction
}

export function usePostsPanel({
  initialSearch,
}: {
  initialSearch?: string
}) {
  const t = useTranslations("admin.posts")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(initialSearch ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [reason, setReason] = useState("")

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    startTransition(() => router.replace(`/admin/posts?${next.toString()}`))
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParam("q", search.trim() || undefined)
  }

  function openConfirm(post: AdminPostRow, action: PostModerationAction) {
    setConfirmTarget({ post, action })
  }

  function closeConfirm() {
    setConfirmTarget(null)
    setReason("")
  }

  function submit() {
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
      closeConfirm()
      router.refresh()
    })
  }

  return {
    closeConfirm,
    confirmTarget,
    onSearchSubmit,
    openConfirm,
    pending,
    reason,
    search,
    setReason,
    setSearch,
    submit,
    updateParam,
  }
}
