"use client"

import { useTranslations } from "next-intl"

import type { AdminPostRow } from "@/features/admin/api/posts"
import { PostActionDialog } from "./posts-panel/post-action-dialog"
import { PostFilters } from "./posts-panel/post-filters"
import { PostsTable } from "./posts-panel/posts-table"
import { usePostsPanel } from "./posts-panel/use-posts-panel"

export function PostsPanel({
  items,
  query,
}: {
  items: AdminPostRow[]
  query: { type?: string; status?: string; search?: string }
}) {
  const t = useTranslations("admin.posts")
  const {
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
  } = usePostsPanel({ initialSearch: query.search })

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <PostFilters
        count={items.length}
        onFilterChange={updateParam}
        onSearchChange={setSearch}
        onSearchSubmit={onSearchSubmit}
        query={query}
        search={search}
      />

      <PostsTable items={items} onAction={openConfirm} pending={pending} />

      <PostActionDialog
        confirmTarget={confirmTarget}
        onClose={closeConfirm}
        onReasonChange={setReason}
        onSubmit={submit}
        pending={pending}
        reason={reason}
      />
    </>
  )
}
