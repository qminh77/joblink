"use client"

import { useOptimistic, startTransition } from "react"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { UserPlus, Users, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { useCancelConnectionRequest } from "../../hooks"
import type { InvitationItem } from "../../types"
import { EmptyStateCard } from "./empty-state-card"

function OutgoingCard({ item }: { item: InvitationItem }) {
  const t = useTranslations("network.sent")
  const tButton = useTranslations("network.button")
  const cancel = useCancelConnectionRequest()

  const [hidden, setHidden] = useOptimistic(false, () => true)

  if (hidden) return null

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={profileHref(item.userId, item.role)}>
          <Avatar className="size-10 cursor-pointer hover:opacity-80 transition-opacity">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-xs">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref(item.userId, item.role)}
            className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors block"
          >
            {item.displayName}
          </Link>
          {item.headline ? (
            <p className="text-xs text-muted-foreground truncate">
              {item.headline}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            startTransition(async () => {
              setHidden(true)
              await cancel.mutateAsync(item.connectionId).catch(() => {})
            })
          }}
        >
          <X />
          {t("cancel")}
        </Button>
      </div>
    </Card>
  )
}

export function OutgoingTab({
  items,
  onExplore,
}: {
  items: InvitationItem[]
  onExplore: () => void
}) {
  const t = useTranslations("network.sent")
  const tInv = useTranslations("network.invitations")

  if (items.length === 0) {
    return (
      <EmptyStateCard
        icon={Users}
        title={t("emptyTitle")}
        description={t("emptyDesc")}
        action={
          <Button variant="ghost" size="sm" onClick={onExplore}>
            <UserPlus /> {tInv("explore")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <OutgoingCard key={item.connectionId} item={item} />
      ))}
    </div>
  )
}
