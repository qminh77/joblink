"use client"

import { useTranslations } from "next-intl"
import { UserX } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useBlockedUsers, useUnblockUser } from "@/features/network/hooks"
import { getInitials } from "@/lib/utils/format"

// Trang quản lý tài khoản bị chặn (UC-47) — điểm vào để bỏ chặn kể cả khi không
// truy cập được hồ sơ người đã chặn. Dữ liệu nạp client-side qua React Query.
export function BlockedAccountsCard() {
  const t = useTranslations("settings.blocked")
  const { data: blocked, isLoading } = useBlockedUsers()
  const unblock = useUnblockUser()
  const list = blocked ?? []

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-4">
      <div>
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t("loading")}
        </p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center">
          <UserX className="w-9 h-9 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((u) => (
            <li
              key={u.blockId}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <Avatar className="w-10 h-10">
                {u.avatarUrl ? <AvatarImage src={u.avatarUrl} /> : null}
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(u.displayName, "JL")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {u.displayName}
                </p>
                {u.headline ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {u.headline}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={unblock.isPending}
                onClick={() => unblock.mutate(u.userId)}
              >
                {t("unblock")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
