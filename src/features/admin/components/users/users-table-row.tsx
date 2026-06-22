"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations, useFormatter } from "next-intl"
import { RotateCcw, Shield, ShieldOff } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminUserRow } from "@/features/admin/types"
import type { AdminRoleRow } from "@/features/admin/api/roles"
import { updateUserRbacRole } from "@/features/admin/api/users"
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
  roles,
  pending,
  onAction,
}: {
  user: AdminUserRow
  roles: AdminRoleRow[]
  pending: boolean
  onAction: (target: { user: AdminUserRow; action: UserActionType }) => void
}) {
  const t = useTranslations("admin.users")
  const tStatuses = useTranslations("admin.users.statuses")
  const format = useFormatter()
  const router = useRouter()
  const [updatingRbac, setUpdatingRbac] = useState(false)
  const isProtectedAdmin = user.role === "admin"

  const handleRbacRoleChange = async (newRoleName: string) => {
    if (newRoleName === "unassigned" || newRoleName === user.role) return
    setUpdatingRbac(true)
    try {
      const result = await updateUserRbacRole(user.id, newRoleName)
      if (result.ok) {
        toast.success(t("roleUpdateSuccess"))
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } finally {
      setUpdatingRbac(false)
    }
  }

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
        <Select
          value={user.role}
          onValueChange={handleRbacRoleChange}
          disabled={pending || updatingRbac || isProtectedAdmin}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={r.name}>
                {r.name} {r.is_system && "(Hệ thống)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          !isProtectedAdmin ? (
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
          !isProtectedAdmin ? (
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
