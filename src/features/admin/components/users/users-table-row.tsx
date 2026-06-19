"use client"

import Link from "next/link"
import { useTranslations, useFormatter } from "next-intl"
import { RotateCcw, Shield, ShieldOff } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AdminUserRow } from "@/features/admin/types"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"
import type { UserActionType } from "./users-action-dialog"

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

export function UsersTableRow({
  user,
  pending,
  onAction,
}: {
  user: AdminUserRow
  pending: boolean
  onAction: (target: { user: AdminUserRow; action: UserActionType }) => void
}) {
  const t = useTranslations("admin.users")
  const tRoles = useTranslations("admin.users.roles")
  const tStatuses = useTranslations("admin.users.statuses")
  const format = useFormatter()

  return (
    <tr className="hover:bg-muted/20">
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
                onAction({ user, action: "ban" })
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
                onAction({ user, action: "suspend" })
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
                onAction({ user, action: "restore" })
              }
              title={t("actionRestore")}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}
