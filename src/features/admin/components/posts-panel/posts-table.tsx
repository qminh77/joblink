"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { ExternalLink, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AdminPostRow } from "../../api/posts"
import {
  ACTION_STYLE,
  PostActionIcon,
  STATUS_STYLE,
  TYPE_STYLE,
  VISIBILITY_STYLE,
  type PostModerationAction,
} from "./constants"

function postPreview(content: string, max = 120) {
  return `${content.substring(0, max)}${content.length > max ? "..." : ""}`
}

function getActions(post: AdminPostRow): PostModerationAction[] {
  return [post.status === "hidden" ? "restore" : "hide", "delete"]
}

export function PostsTable({
  items,
  onAction,
  pending,
}: {
  items: AdminPostRow[]
  onAction: (post: AdminPostRow, action: PostModerationAction) => void
  pending: boolean
}) {
  const t = useTranslations("admin.posts")
  const tTypes = useTranslations("admin.posts.types")
  const tStatuses = useTranslations("admin.posts.statuses")
  const tVisibility = useTranslations("admin.posts.visibilityLabel")
  const format = useFormatter()

  return (
    <Card className="bg-transparent border-none shadow-none rounded-xl overflow-hidden p-0">
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
                    {postPreview(post.content)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        TYPE_STYLE[post.postType] ?? TYPE_STYLE.text
                      }`}
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
                      className={`text-xs ${
                        VISIBILITY_STYLE[post.visibility] ??
                        VISIBILITY_STYLE.public
                      }`}
                    >
                      {tVisibility(post.visibility)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        STATUS_STYLE[post.status] ?? STATUS_STYLE.active
                      }`}
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
                      {getActions(post).map((action) => (
                        <Button
                          key={action}
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 rounded-lg ${
                            ACTION_STYLE[action]
                          }`}
                          disabled={pending}
                          onClick={() => onAction(post, action)}
                          title={t(action)}
                        >
                          <PostActionIcon action={action} />
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
  )
}
